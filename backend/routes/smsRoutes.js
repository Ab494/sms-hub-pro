import express from 'express';
import {
  sendSMS,
  sendBulkSMS,
  getCampaigns,
  getCampaign,
  getSMSLogs,
  getSMSStats,
  cancelCampaign
} from '../controllers/smsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Send SMS
router.post('/send', sendSMS);
router.post('/bulk', sendBulkSMS);

// Campaigns
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaign);
router.post('/campaigns/:id/cancel', cancelCampaign);

// Logs and stats
router.get('/logs', getSMSLogs);
router.get('/stats', getSMSStats);

export default router;
