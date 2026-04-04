import User from '../models/User.js';
import CreditTransaction from '../models/CreditTransaction.js';
import SMSLog from '../models/SMSLog.js';
import Campaign from '../models/Campaign.js';
import Withdrawal from '../models/Withdrawal.js';

/**
 * Admin Controller
 * Handles admin-only operations for company management
 */

/**
 * @desc    Get all companies/users
 * @route   GET /api/admin/companies
 * @access  Private (Admin only)
 */
export const getAllCompanies = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { role: 'user' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const [companies, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Companies retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single company details
 * @route   GET /api/admin/companies/:id
 * @access  Private (Admin only)
 */
export const getCompany = async (req, res, next) => {
  try {
    const company = await User.findOne({ _id: req.params.id, role: 'user' })
      .select('-password');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get company statistics
    const [totalSMS, totalCampaigns, creditTransactions, recentLogs] = await Promise.all([
      SMSLog.countDocuments({ userId: company._id }),
      Campaign.countDocuments({ userId: company._id }),
      CreditTransaction.find({ userId: company._id })
        .sort({ createdAt: -1 })
        .limit(10),
      SMSLog.find({ userId: company._id })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Calculate totals
    const stats = await SMSLog.aggregate([
      { $match: { userId: company._id } },
      {
        $group: {
          _id: null,
          totalSent: { $sum: 1 },
          totalDelivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        company,
        stats: {
          totalSMS,
          totalCampaigns,
          totalSent: stats[0]?.totalSent || 0,
          totalDelivered: stats[0]?.totalDelivered || 0,
          totalFailed: stats[0]?.totalFailed || 0,
          totalCost: stats[0]?.totalCost || 0
        },
        recentTransactions: creditTransactions,
        recentLogs
      },
      message: 'Company retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update company
 * @route   PUT /api/admin/companies/:id
 * @access  Private (Admin only)
 */
export const updateCompany = async (req, res, next) => {
  try {
    const { name, email, company, phone, senderId, isActive, role } = req.body;

    const existingCompany = await User.findOne({ 
      _id: req.params.id, 
      role: 'user' 
    });

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingCompany.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update fields
    if (name) existingCompany.name = name;
    if (email) existingCompany.email = email;
    if (company !== undefined) existingCompany.company = company;
    if (phone !== undefined) existingCompany.phone = phone;
    if (senderId !== undefined) existingCompany.senderId = senderId;
    if (isActive !== undefined) existingCompany.isActive = isActive;
    if (role) existingCompany.role = role;

    await existingCompany.save();

    res.json({
      success: true,
      data: {
        company: {
          id: existingCompany._id,
          name: existingCompany.name,
          email: existingCompany.email,
          company: existingCompany.company,
          phone: existingCompany.phone,
          senderId: existingCompany.senderId,
          isActive: existingCompany.isActive,
          role: existingCompany.role,
          smsBalance: existingCompany.smsBalance
        }
      },
      message: 'Company updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete company (soft delete - deactivate)
 * @route   DELETE /api/admin/companies/:id
 * @access  Private (Admin only)
 */
export const deleteCompany = async (req, res, next) => {
  try {
    const company = await User.findOne({ _id: req.params.id, role: 'user' });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Soft delete - just deactivate
    company.isActive = false;
    await company.save();

    res.json({
      success: true,
      message: 'Company deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
export const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      totalSMS,
      totalCampaigns,
      creditStats,
      recentTransactions
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      SMSLog.countDocuments(),
      Campaign.countDocuments(),
      CreditTransaction.aggregate([
        {
          $group: {
            _id: null,
            totalPurchased: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$amount', 0] } },
            totalUsed: { $sum: { $cond: [{ $eq: ['$type', 'usage'] }, { $abs: '$amount' }, 0] } },
            totalRevenue: { $sum: '$price' },
            totalCost: { $sum: '$cost' }
          }
        }
      ]),
      CreditTransaction.find()
        .populate('userId', 'name email company')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await SMSLog.aggregate([
      { $match: { createdAt: { $gte: today } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCompanies,
          activeCompanies,
          totalSMS,
          totalCampaigns
        },
        credits: {
          totalPurchased: creditStats[0]?.totalPurchased || 0,
          totalUsed: creditStats[0]?.totalUsed || 0,
          totalRevenue: creditStats[0]?.totalRevenue || 0,
          totalCost: creditStats[0]?.totalCost || 0,
          profit: (creditStats[0]?.totalRevenue || 0) - (creditStats[0]?.totalCost || 0)
        },
        today: {
          sent: todayStats.find(s => s._id === 'sent')?.count || 0,
          delivered: todayStats.find(s => s._id === 'delivered')?.count || 0,
          failed: todayStats.find(s => s._id === 'failed')?.count || 0
        },
        recentTransactions
      },
      message: 'Platform stats retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform settings
 * @route   GET /api/admin/settings
 * @access  Private (Admin only)
 */
export const getPlatformSettings = async (req, res, next) => {
  try {
    const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
    
    const settings = await PlatformSettings.find({});
    
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsObj,
      message: 'Settings retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update platform settings
 * @route   PUT /api/admin/settings
 * @access  Private (Admin only)
 */
export const updatePlatformSettings = async (req, res, next) => {
  try {
    const PlatformSettings = (await import('../models/PlatformSettings.js')).default;
    
    const updates = req.body;
    const updatedSettings = [];

    for (const [key, value] of Object.entries(updates)) {
      const setting = await PlatformSettings.findOneAndUpdate(
        { key },
        { 
          value, 
          updatedBy: req.user._id,
          description: `Updated by admin on ${new Date().toISOString()}`
        },
        { upsert: true, new: true }
      );
      updatedSettings.push(setting);
    }

    res.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions (admin view)
 * @route   GET /api/admin/transactions
 * @access  Private (Admin only)
 */
export const getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, type, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      CreditTransaction.find(query)
        .populate('userId', 'name email company')
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
 * @desc    Get all SMS logs (admin view)
 * @route   GET /api/admin/sms-logs
 * @access  Private (Admin only)
 */
export const getAllSMSLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, status, startDate, endDate, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const [logs, total] = await Promise.all([
      SMSLog.find(query)
        .populate('userId', 'name email company')
        .populate('campaignId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SMSLog.countDocuments(query)
    ]);

    // Get status breakdown
    const statusBreakdown = await SMSLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        logs,
        statusBreakdown,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'SMS logs retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all campaigns (admin view)
 * @route   GET /api/admin/campaigns
 * @access  Private (Admin only)
 */
export const getAllCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('userId', 'name email company')
        .select('-recipients')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Campaign.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Campaigns retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request a profit withdrawal
 * @route   POST /api/admin/withdrawals
 * @access  Private (Admin only)
 */
export const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, recipientDetails } = req.body;

    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is KES 100'
      });
    }

    // Check available profit
    const [creditStats] = await CreditTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    const availableProfit = (creditStats?.totalRevenue || 0) - (creditStats?.totalCost || 0);

    // Check already requested withdrawals
    const [withdrawalStats] = await Withdrawal.aggregate([
      { $match: { status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, totalPending: { $sum: '$amount' } } }
    ]);

    const availableForWithdrawal = availableProfit - (withdrawalStats?.totalPending || 0);

    if (amount > availableForWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Available for withdrawal: KES ${availableForWithdrawal.toLocaleString()}`
      });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      requestedBy: req.user._id,
      amount,
      method,
      recipientDetails
    });

    res.status(201).json({
      success: true,
      data: {
        withdrawal: {
          id: withdrawal._id,
          amount: withdrawal.amount,
          method: withdrawal.method,
          status: withdrawal.status,
          createdAt: withdrawal.createdAt
        }
      },
      message: 'Withdrawal request submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all withdrawals
 * @route   GET /api/admin/withdrawals
 * @access  Private (Admin only)
 */
export const getWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.status = status;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .populate('requestedBy', 'name email')
        .populate('processedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Withdrawal.countDocuments(query)
    ]);

    // Get totals
    const totals = await Withdrawal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        withdrawals,
        totals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Withdrawals retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process a withdrawal (approve/reject)
 * @route   PUT /api/admin/withdrawals/:id
 * @access  Private (Admin only)
 */
export const processWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'complete', 'fail', 'cancel'

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    if (action === 'complete') {
      await withdrawal.complete(req.user._id);
    } else if (action === 'fail') {
      await withdrawal.fail(req.user._id, notes);
    } else if (action === 'cancel') {
      withdrawal.status = 'cancelled';
      withdrawal.notes = notes;
      withdrawal.processedBy = req.user._id;
      withdrawal.processedAt = new Date();
      await withdrawal.save();
    }

    res.json({
      success: true,
      data: { withdrawal },
      message: `Withdrawal ${action}d successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get withdrawal statistics
 * @route   GET /api/admin/withdrawals/stats
 * @access  Private (Admin only)
 */
export const getWithdrawalStats = async (req, res, next) => {
  try {
    // Get profit calculations
    const [creditStats] = await CreditTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    const totalProfit = (creditStats?.totalRevenue || 0) - (creditStats?.totalCost || 0);

    // Get withdrawal statistics
    const withdrawalStats = await Withdrawal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Calculate available for withdrawal
    const pendingWithdrawals = withdrawalStats.find(s => s._id === 'pending')?.total || 0;
    const processingWithdrawals = withdrawalStats.find(s => s._id === 'processing')?.total || 0;
    const totalWithdrawn = withdrawalStats.find(s => s._id === 'completed')?.total || 0;

    const availableForWithdrawal = totalProfit - pendingWithdrawals - processingWithdrawals - totalWithdrawn;

    res.json({
      success: true,
      data: {
        totalProfit,
        totalWithdrawn,
        pendingWithdrawals,
        processingWithdrawals,
        availableForWithdrawal: Math.max(0, availableForWithdrawal),
        withdrawalStats
      },
      message: 'Withdrawal stats retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/admin/companies/:id/toggle-active
 * @access  Private (Admin only)
 */
export const toggleUserActive = async (req, res, next) => {
  try {
    const company = await User.findOne({ _id: req.params.id, role: 'user' });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    company.isActive = !company.isActive;
    await company.save();

    res.json({
      success: true,
      data: {
        isActive: company.isActive
      },
      message: `Company ${company.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  getPlatformStats,
  getPlatformSettings,
  updatePlatformSettings,
  getAllTransactions,
  getAllSMSLogs,
  getAllCampaigns,
  toggleUserActive,
  requestWithdrawal,
  getWithdrawals,
  processWithdrawal,
  getWithdrawalStats
};
