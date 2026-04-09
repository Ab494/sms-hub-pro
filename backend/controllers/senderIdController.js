import SenderID from '../models/SenderID.js';
import SenderIDRequest from '../models/SenderIDRequest.js';
import User from '../models/User.js';

/**
 * Get available sender IDs for purchase
 */
export const getAvailableSenderIds = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { ownerId: null, isActive: true, isRegistered: true };
    if (category && category !== 'all') {
      query.category = category;
    }
    const senderIds = await SenderID.find(query).sort({ price: 1 });
    res.json({ success: true, data: senderIds });
  } catch (error) {
    console.error('Get available sender IDs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sender IDs' });
  }
};

/**
 * Get user's owned sender IDs
 */
export const getMySenderIds = async (req, res) => {
  try {
    const senderIds = await SenderID.find({ ownerId: req.user._id, isActive: true });
    res.json({ success: true, data: senderIds });
  } catch (error) {
    console.error('Get my sender IDs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your sender IDs' });
  }
};

/**
 * Purchase a pre-registered sender ID
 */
export const purchaseSenderId = async (req, res) => {
  try {
    const senderId = await SenderID.findById(req.params.id);
    if (!senderId) {
      return res.status(404).json({ success: false, message: 'Sender ID not found' });
    }
    if (senderId.ownerId) {
      return res.status(400).json({ success: false, message: 'Sender ID is already owned' });
    }
    if (!senderId.isRegistered) {
      return res.status(400).json({ success: false, message: 'Sender ID is not yet registered' });
    }

    // Check user balance
    const user = await User.findById(req.user._id);
    if (user.smsBalance < senderId.price) {
      return res.status(400).json({ success: false, message: 'Insufficient credits. Please top up first.' });
    }

    // Deduct credits and assign
    user.smsBalance -= senderId.price;
    user.senderId = senderId.senderId;
    await user.save();

    await senderId.purchase(req.user._id);

    res.json({ success: true, message: 'Sender ID purchased successfully', data: senderId });
  } catch (error) {
    console.error('Purchase sender ID error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to purchase sender ID' });
  }
};

/**
 * Request a custom sender ID
 */
export const requestCustomSenderId = async (req, res) => {
  try {
    const { senderId, reason } = req.body;

    if (!senderId || senderId.length < 3 || senderId.length > 11) {
      return res.status(400).json({ success: false, message: 'Sender ID must be 3-11 characters' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    // Check if already exists
    const existing = await SenderID.findOne({ senderId: senderId.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This Sender ID is already taken' });
    }

    // Check for duplicate pending request
    const pendingRequest = await SenderIDRequest.findOne({
      userId: req.user._id,
      requestedSenderId: senderId.toUpperCase(),
      status: 'pending',
    });
    if (pendingRequest) {
      return res.status(400).json({ success: false, message: 'You already have a pending request for this Sender ID' });
    }

    const request = await SenderIDRequest.create({
      userId: req.user._id,
      requestedSenderId: senderId.toUpperCase(),
      reason,
    });

    res.status(201).json({ success: true, message: 'Request submitted successfully', data: request });
  } catch (error) {
    console.error('Request custom sender ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit request' });
  }
};

/**
 * Get user's sender ID requests
 */
export const getMyRequests = async (req, res) => {
  try {
    const requests = await SenderIDRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};
