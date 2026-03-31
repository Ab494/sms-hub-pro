import User from '../models/User.js';
import CreditTransaction from '../models/CreditTransaction.js';
import PlatformSettings from '../models/PlatformSettings.js';
import { initiateStkPush, processMpesaCallback, verifyPayment, isMpesaConfigured } from '../services/paymentService.js';

/**
 * Credits Controller
 * Handles credit balance, purchases, and transactions
 */

/**
 * @desc    Get user's credit balance and transactions
 * @route   GET /api/credits
 * @access  Private
 */
export const getCredits = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get transaction history
    const transactions = await CreditTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Get pricing info
    const pricing = await PlatformSettings.getPricing();
    
    res.json({
      success: true,
      data: {
        balance: user.smsBalance,
        transactions: transactions.map(t => t.getSummary()),
        pricing
      },
      message: 'Credits retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get credit pricing
 * @route   GET /api/credits/pricing
 * @access  Public
 */
export const getPricing = async (req, res, next) => {
  try {
    const pricing = await PlatformSettings.getPricing();
    
    res.json({
      success: true,
      data: pricing,
      message: 'Pricing retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Purchase credits via M-Pesa STK Push
 * @route   POST /api/credits/purchase
 * @access  Private
 */
export const purchaseCredits = async (req, res, next) => {
  try {
    const { amount, paymentMethod, phone } = req.body;
    
    // Validate
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid credit amount'
      });
    }
    
    const user = await User.findById(req.user._id);
    const pricing = await PlatformSettings.getPricing();
    
    // Check minimum purchase
    if (amount < pricing.minimum_credit_purchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase is ${pricing.minimum_credit_purchase} credits`
      });
    }
    
    // Calculate bonus credits
    const bonusCredits = Math.floor(amount * (pricing.bonus_credits_percent / 100));
    const totalCredits = amount + bonusCredits;
    
    // Calculate cost
    const totalCost = amount * pricing.sms_price_per_unit;
    
    // Handle M-Pesa payment
    if (paymentMethod === 'mpesa' && phone) {
      // Format phone number
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }
      
      // Initiate STK Push
      const mpesaResult = await initiateStkPush(
        formattedPhone,
        totalCost,
        user._id.toString(),
        `SMS Credits: ${amount} credits`
      );
      
      if (!mpesaResult.success) {
        return res.status(400).json({
          success: false,
          message: mpesaResult.error || 'Failed to initiate M-Pesa payment',
          code: mpesaResult.code
        });
      }
      
      // Create pending transaction
      const transaction = await CreditTransaction.create({
        userId: user._id,
        type: 'purchase',
        amount: totalCredits,
        cost: amount * pricing.sms_cost_per_unit,
        price: totalCost,
        previousBalance: user.smsBalance,
        newBalance: user.smsBalance,
        description: `Pending: ${amount} credits${bonusCredits > 0 ? ` + ${bonusCredits} bonus` : ''} via M-Pesa`,
        reference: mpesaResult.data?.CheckoutRequestID || `PAY-${Date.now()}`,
        status: 'pending'
      });
      
      return res.status(202).json({
        success: true,
        data: {
          checkoutRequestId: mpesaResult.data?.CheckoutRequestID,
          merchantRequestId: mpesaResult.data?.MerchantRequestID,
          amount: totalCost,
          phone: formattedPhone,
          transactionId: transaction._id,
          message: 'Please check your phone and enter PIN to complete payment'
        },
        message: 'M-Pesa payment initiated'
      });
    }
    
    // Manual/bank transfer (simulated - credits added immediately)
    const previousBalance = user.smsBalance;
    user.smsBalance += totalCredits;
    await user.save();
    
    // Create transaction record
    const transaction = await CreditTransaction.create({
      userId: user._id,
      type: 'purchase',
      amount: totalCredits,
      cost: amount * pricing.sms_cost_per_unit,
      price: totalCost,
      previousBalance,
      newBalance: user.smsBalance,
      description: `Purchased ${amount} credits${bonusCredits > 0 ? ` + ${bonusCredits} bonus` : ''} via ${paymentMethod || 'manual'}`,
      reference: `PAY-${Date.now()}`,
      status: 'completed'
    });
    
    res.status(201).json({
      success: true,
      data: {
        purchasedCredits: amount,
        bonusCredits,
        totalCredits,
        cost: totalCost,
        balance: user.smsBalance,
        transaction: transaction.getSummary()
      },
      message: 'Credits purchased successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deduct credits for SMS sending (called from SMS controller)
 * @route   Internal use
 * @access  Private
 */
export const deductCredits = async (userId, segments, campaignId = null) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.smsBalance < segments) {
    throw new Error('Insufficient credit balance');
  }
  
  const pricing = await PlatformSettings.getPricing();
  const previousBalance = user.smsBalance;
  
  // Deduct credits
  user.smsBalance -= segments;
  await user.save();
  
  // Create transaction record
  const transaction = await CreditTransaction.create({
    userId: user._id,
    type: 'usage',
    amount: -segments,
    cost: segments * pricing.sms_cost_per_unit,
    price: segments * pricing.sms_price_per_unit,
    previousBalance,
    newBalance: user.smsBalance,
    description: `Sent ${segments} SMS segment(s)`,
    campaignId,
    status: 'completed'
  });
  
  return {
    deducted: segments,
    cost: segments * pricing.sms_cost_per_unit,
    price: segments * pricing.sms_price_per_unit,
    profit: segments * (pricing.sms_price_per_unit - pricing.sms_cost_per_unit),
    transactionId: transaction._id
  };
};

/**
 * @desc    Admin: Adjust user's credit balance
 * @route   POST /api/credits/adjust
 * @access  Private (Admin only)
 */
export const adjustCredits = async (req, res, next) => {
  try {
    const { userId, amount, type, description } = req.body;
    
    // Only admins can adjust credits
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can adjust credits'
      });
    }
    
    if (!userId || !amount || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, amount, and type'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const previousBalance = user.smsBalance;
    
    if (type === 'add') {
      user.smsBalance += amount;
    } else if (type === 'subtract') {
      if (user.smsBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance to subtract'
        });
      }
      user.smsBalance -= amount;
    } else if (type === 'set') {
      user.smsBalance = amount;
    }
    
    await user.save();
    
    // Create transaction record
    const transaction = await CreditTransaction.create({
      userId: user._id,
      type: 'adjustment',
      amount: type === 'set' ? amount - previousBalance : (type === 'add' ? amount : -amount),
      cost: 0,
      price: 0,
      previousBalance,
      newBalance: user.smsBalance,
      description: description || `Admin ${type} adjustment`,
      adjustedBy: req.user._id,
      status: 'completed'
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          smsBalance: user.smsBalance
        },
        transaction: transaction.getSummary()
      },
      message: 'Credit balance adjusted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions (admin)
 * @route   GET /api/credits/transactions
 * @access  Private (Admin only)
 */
export const getAllTransactions = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view all transactions'
      });
    }
    
    const { page = 1, limit = 50, userId, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;
    
    const [transactions, total] = await Promise.all([
      CreditTransaction.find(query)
        .populate('userId', 'name email company')
        .populate('adjustedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CreditTransaction.countDocuments(query)
    ]);
    
    // Calculate totals
    const totals = await CreditTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCreditsPurchased: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$amount', 0] } },
          totalCreditsUsed: { $sum: { $cond: [{ $eq: ['$type', 'usage'] }, { $abs: '$amount' }, 0] } },
          totalRevenue: { $sum: '$price' },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        transactions,
        totals: totals[0] || { totalCreditsPurchased: 0, totalCreditsUsed: 0, totalRevenue: 0, totalCost: 0 },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Transactions retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Initialize default platform settings
 * @route   POST /api/credits/initialize
 * @access  Private (Admin only)
 */
export const initializeSettings = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can initialize settings'
      });
    }
    
    await PlatformSettings.initializeDefaults();
    
    const pricing = await PlatformSettings.getPricing();
    
    res.json({
      success: true,
      data: pricing,
      message: 'Platform settings initialized successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle M-Pesa callback (webhook)
 * @route   POST /api/credits/callback
 * @access  Public (M-Pesa webhook)
 */
export const mpesaCallback = async (req, res, next) => {
  try {
    const callbackData = req.body;
    const { processMpesaCallback } = await import('../services/paymentService.js');
    
    const result = await processMpesaCallback(callbackData);
    
    if (result.success && result.data) {
      const { checkoutRequestId, amount, mpesaReceiptNumber, phoneNumber } = result.data;
      
      // Find pending transaction
      const transaction = await CreditTransaction.findOne({
        reference: checkoutRequestId,
        status: 'pending'
      });
      
      if (transaction) {
        const user = await User.findById(transaction.userId);
        
        if (user) {
          // Update user balance
          user.smsBalance += transaction.amount;
          await user.save();
          
          // Update transaction
          transaction.status = 'completed';
          transaction.description = `Payment confirmed. Receipt: ${mpesaReceiptNumber}`;
          transaction.newBalance = user.smsBalance;
          await transaction.save();
        }
      }
    }
    
    res.json({ success: true, message: 'Callback received' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ success: false, message: 'Callback processing failed' });
  }
};

/**
 * @desc    Verify payment status
 * @route   POST /api/credits/verify
 * @access  Private
 */
export const verifyPaymentStatus = async (req, res, next) => {
  try {
    const { checkoutRequestId } = req.params.checkoutRequestId ? req.params : req.body;
    
    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'Checkout request ID is required'
      });
    }
    
    const { verifyPayment } = await import('../services/paymentService.js');
    const result = await verifyPayment(checkoutRequestId);
    
    if (result.success) {
      const { ResultCode, ResultDesc } = result.data;
      
      // If payment successful, check if credits were added
      if (ResultCode === 0) {
        const transaction = await CreditTransaction.findOne({
          reference: checkoutRequestId,
          status: 'pending'
        });
        
        if (transaction) {
          const user = await User.findById(transaction.userId);
          
          if (user && user.smsBalance >= transaction.amount) {
            transaction.status = 'completed';
            transaction.description = 'Payment verified and completed';
            transaction.newBalance = user.smsBalance;
            await transaction.save();
            
            return res.json({
              success: true,
              data: {
                status: 'completed',
                balance: user.smsBalance
              },
              message: 'Payment successful, credits added'
            });
          }
        }
        
        return res.json({
          success: true,
          data: { status: 'processing' },
          message: 'Payment received, processing credits'
        });
      }
      
      return res.json({
        success: false,
        data: { status: 'failed', message: ResultDesc },
        message: ResultDesc
      });
    }
    
    res.json({
      success: false,
      data: { status: 'unknown' },
      message: result.error || 'Unable to verify payment'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCredits,
  getPricing,
  purchaseCredits,
  deductCredits,
  adjustCredits,
  getAllTransactions,
  initializeSettings,
  mpesaCallback,
  verifyPaymentStatus
};