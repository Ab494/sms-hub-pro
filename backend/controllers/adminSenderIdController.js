import SenderID from '../models/SenderID.js';
import SenderIDRequest from '../models/SenderIDRequest.js';
import User from '../models/User.js';

/**
 * Get all sender IDs (admin)
 */
export const getAllSenderIds = async (req, res) => {
  try {
    const senderIds = await SenderID.find().populate('ownerId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: senderIds });
  } catch (error) {
    console.error('Get all sender IDs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sender IDs' });
  }
};

/**
 * Create a new sender ID (admin)
 */
export const createSenderId = async (req, res) => {
  try {
    const { senderId, name, description, price, category, isRegistered } = req.body;

    if (!senderId || !name || price == null) {
      return res.status(400).json({ success: false, message: 'Sender ID, name, and price are required' });
    }

    const existing = await SenderID.findOne({ senderId: senderId.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This Sender ID already exists' });
    }

    const newSenderId = await SenderID.create({
      senderId: senderId.toUpperCase(),
      name,
      description,
      price,
      category: category || 'generic',
      isRegistered: isRegistered !== false,
      isActive: true,
    });

    res.status(201).json({ success: true, data: newSenderId });
  } catch (error) {
    console.error('Create sender ID error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create sender ID' });
  }
};

/**
 * Delete a sender ID (admin, only if not owned)
 */
export const deleteSenderId = async (req, res) => {
  try {
    const senderId = await SenderID.findById(req.params.id);
    if (!senderId) {
      return res.status(404).json({ success: false, message: 'Sender ID not found' });
    }
    if (senderId.ownerId) {
      return res.status(400).json({ success: false, message: 'Cannot delete a purchased Sender ID' });
    }

    await SenderID.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sender ID deleted' });
  } catch (error) {
    console.error('Delete sender ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete sender ID' });
  }
};

/**
 * Get all sender ID requests (admin)
 */
export const getAllSenderIdRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const requests = await SenderIDRequest.find(query)
      .populate('userId', 'name email company')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get sender ID requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};

/**
 * Approve or reject a sender ID request (admin)
 */
export const reviewSenderIdRequest = async (req, res) => {
  try {
    const { action, adminNotes } = req.body;
    const request = await SenderIDRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request has already been reviewed' });
    }

    if (action === 'approve') {
      // Create the sender ID in the system
      const newSenderId = await SenderID.create({
        senderId: request.requestedSenderId,
        name: request.requestedSenderId,
        description: `Custom Sender ID requested by user`,
        price: request.price || 5000,
        category: 'custom',
        isRegistered: true,
        isActive: true,
      });

      request.status = 'approved';
      request.adminNotes = adminNotes || 'Approved';
    } else if (action === 'reject') {
      request.status = 'rejected';
      request.adminNotes = adminNotes || 'Rejected';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use "approve" or "reject".' });
    }

    await request.save();
    res.json({ success: true, message: `Request ${action}d successfully`, data: request });
  } catch (error) {
    console.error('Review sender ID request error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to review request' });
  }
};
