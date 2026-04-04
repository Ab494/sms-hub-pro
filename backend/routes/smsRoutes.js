import express from 'express';
import multer from 'multer';
import {
  sendSMS,
  sendBulkSMS,
  uploadContacts,
  getCampaigns,
  getCampaign,
  getSMSLogs,
  getSMSStats,
  cancelCampaign
} from '../controllers/smsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// All routes require authentication
router.use(protect);

// Send SMS
router.post('/send', sendSMS);
router.post('/bulk', sendBulkSMS);
router.post('/upload-contacts', upload.single('file'), uploadContacts);

// Campaigns
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaign);
router.post('/campaigns/:id/cancel', cancelCampaign);

// Logs and stats
router.get('/logs', getSMSLogs);
router.get('/stats', getSMSStats);

export default router;
