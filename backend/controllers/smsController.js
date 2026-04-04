import Campaign from '../models/Campaign.js';
import SMSLog from '../models/SMSLog.js';
import Contact from '../models/Contact.js';
import User from '../models/User.js';
import { sendSMS as sendSMSApi } from '../services/smsService.js';
import { deductCredits } from '../controllers/creditsController.js';

/**
 * SMS Controller
 * Handles SMS sending, campaigns, and logs
 */

/**
 * @desc    Send single SMS
 * @route   POST /api/sms/send
 * @access  Private
 */
export const sendSMS = async (req, res, next) => {
  try {
    const { phone, message, senderId } = req.body;

    console.log('SMS Send Request:', { phone, message: message?.substring(0, 50), senderId, userId: req.user._id });

    // Validate
    if (!phone || !message) {
      console.log('Validation failed: missing phone or message');
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    // Validate phone number format
    const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      console.log('Invalid phone number format:', phone);
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Kenyan phone number (e.g., 0712345678 or +254712345678)'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('User not found:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User balance:', user.smsBalance);

    const finalSenderId = senderId || user.senderId || process.env.DEFAULT_SENDER_ID;

    // Calculate cost
    const segments = Math.ceil(message.length / 160);
    const totalCost = segments;

    console.log('Calculated cost:', { segments, totalCost });

    // Check SMS balance before sending
    if (user.smsBalance < totalCost) {
      console.log('Insufficient balance:', { userBalance: user.smsBalance, required: totalCost });
      return res.status(400).json({
        success: false,
        message: `Insufficient SMS balance. Need ${totalCost} credits, you have ${user.smsBalance}`
      });
    }

    // Format phone number
    const formattedPhone = phone.replace(/[^0-9+]/g, '');

    // Create campaign for single SMS
    const campaign = await Campaign.create({
      userId: req.user._id,
      name: 'Single SMS',
      message,
      recipients: [formattedPhone],
      recipientCount: 1,
      senderId: finalSenderId,
      status: 'queued'
    });

    // Create SMS log
    const smsLog = await SMSLog.create({
      userId: req.user._id,
      campaignId: campaign._id,
      phone: formattedPhone,
      message,
      segments,
      cost: segments,
      senderId: finalSenderId,
      status: 'queued'
    });

    // Add to queue
    const result = await sendSMSApi(formattedPhone, message, finalSenderId);
    
    if (result.success) {
      smsLog.status = 'sent';
      smsLog.messageId = result.messageId;
    } else {
      smsLog.status = 'failed';
      smsLog.errorMessage = result.error;
    }
    await smsLog.save();

    // Return success/failure response
    if (result.success) {
      // Use deductCredits for proper tracking
      try {
        await deductCredits(req.user._id, segments, campaign._id);
      } catch (creditError) {
        // Rollback SMS log if credit deduction fails
        smsLog.status = 'failed';
        smsLog.errorMessage = creditError.message;
        await smsLog.save();
        return res.status(400).json({
          success: false,
          message: creditError.message || 'Failed to deduct credits'
        });
      }
      
      res.status(201).json({
        success: true,
        data: {
          campaign: {
            id: campaign._id,
            status: campaign.status
          },
          sms: {
            id: smsLog._id,
            phone: smsLog.phone,
            segments: smsLog.segments,
            cost: smsLog.cost
          }
        },
        message: 'SMS sent successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to send SMS'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send bulk SMS
 * @route   POST /api/sms/bulk
 * @access  Private
 */
export const sendBulkSMS = async (req, res, next) => {
  try {
    const { phones, message, groupId, name, senderId } = req.body;

    // Validate
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    let recipients = [];

    // Get recipients from phones array or group
    if (phones && Array.isArray(phones) && phones.length > 0) {
      recipients = phones.map(p => p.replace(/[^0-9+]/g, ''));
    } else if (groupId) {
      const contacts = await Contact.find({
        userId: req.user._id,
        groupId,
        isActive: true
      });
      recipients = contacts.map(c => c.phone);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either phone numbers or select a group'
      });
    }

    // Remove duplicates
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipients found'
      });
    }

    const user = await User.findById(req.user._id);
    const finalSenderId = senderId || user.senderId || process.env.DEFAULT_SENDER_ID;

    // Calculate cost
    const segments = Math.ceil(message.length / 160);
    const totalCost = segments * recipients.length;

    if (user.smsBalance < totalCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient SMS balance. Need ${totalCost} units, you have ${user.smsBalance}`
      });
    }

    // Create campaign
    const campaign = await Campaign.create({
      userId: req.user._id,
      name: name || `Bulk SMS - ${recipients.length} recipients`,
      message,
      recipients,
      recipientCount: recipients.length,
      groupId: groupId || null,
      senderId: finalSenderId,
      status: 'queued',
      sentAt: new Date(),
      cost: totalCost
    });

    // Create SMS logs for each recipient
    const smsLogs = await SMSLog.insertMany(
      recipients.map(phone => ({
        userId: req.user._id,
        campaignId: campaign._id,
        phone,
        message,
        segments,
        cost: segments,
        senderId: finalSenderId,
        status: 'queued'
      }))
    );

    // Send all SMS directly
    const results = await Promise.allSettled(
      recipients.map(phone => sendSMSApi(phone, message, finalSenderId))
    );
    
    // Update logs based on results
    for (let i = 0; i < smsLogs.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value.success) {
        smsLogs[i].status = 'sent';
        smsLogs[i].messageId = result.value.messageId;
      } else {
        smsLogs[i].status = 'failed';
        smsLogs[i].errorMessage = result.reason?.message || result.value?.error || 'Failed to send';
      }
    }
    await SMSLog.bulkSave(smsLogs);

    // Use deductCredits for proper tracking
    const successfulCount = smsLogs.filter(log => log.status === 'sent').length;
    const usedSegments = successfulCount * segments;
    
    if (usedSegments > 0) {
      try {
        await deductCredits(req.user._id, usedSegments, campaign._id);
      } catch (creditError) {
        console.error('Credit deduction error:', creditError.message);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          recipientCount: campaign.recipientCount,
          status: campaign.status,
          cost: campaign.cost
        }
      },
      message: `${recipients.length} SMS queued for delivery`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get campaigns
 * @route   GET /api/sms/campaigns
 * @access  Private
 */
export const getCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
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
 * @desc    Get single campaign
 * @route   GET /api/sms/campaigns/:id
 * @access  Private
 */
export const getCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get delivery stats
    const stats = await SMSLog.aggregate([
      { $match: { campaignId: campaign._id } },
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
        campaign,
        stats
      },
      message: 'Campaign retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get SMS logs
 * @route   GET /api/sms/logs
 * @access  Private
 */
export const getSMSLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, campaignId, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    if (campaignId) {
      query.campaignId = campaignId;
    }

    if (search) {
      query.phone = { $regex: search, $options: 'i' };
    }

    const [logs, total] = await Promise.all([
      SMSLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('campaignId', 'name'),
      SMSLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
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
 * @desc    Get SMS statistics
 * @route   GET /api/sms/stats
 * @access  Private
 */
export const getSMSStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get totals
    const [totalSent, totalDelivered, totalFailed, totalCost] = await Promise.all([
      SMSLog.countDocuments({ userId, status: { $in: ['sent', 'delivered'] } }),
      SMSLog.countDocuments({ userId, status: 'delivered' }),
      SMSLog.countDocuments({ userId, status: 'failed' }),
      SMSLog.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ])
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await SMSLog.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get campaigns count
    const campaignsCount = await Campaign.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        totalSent,
        totalDelivered,
        totalFailed,
        totalCost: totalCost[0]?.total || 0,
        deliveryRate: totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(2) : 0,
        todaySent: todayStats.find(s => s._id === 'sent')?.count || 0 + todayStats.find(s => s._id === 'delivered')?.count || 0,
        campaignsCount,
        balance: req.user.smsBalance
      },
      message: 'SMS statistics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel campaign
 * @route   POST /api/sms/campaigns/:id/cancel
 * @access  Private
 */
export const cancelCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (!['queued', 'processing'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel campaign in current status'
      });
    }

    campaign.status = 'cancelled';
    await campaign.save();

    // Update pending logs
    await SMSLog.updateMany(
      { campaignId: campaign._id, status: 'queued' },
      { $set: { status: 'failed', errorMessage: 'Campaign cancelled' } }
    );

    res.json({
      success: true,
      data: {},
      message: 'Campaign cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};
