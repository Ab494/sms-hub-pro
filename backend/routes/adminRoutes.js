import express from 'express';
import {
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
  toggleUserActive
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, admin);

// Company management
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompany);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);
router.patch('/companies/:id/toggle-active', toggleUserActive);

// Platform statistics
router.get('/stats', getPlatformStats);

// Transaction management
router.get('/transactions', getAllTransactions);

// SMS logs
router.get('/sms-logs', getAllSMSLogs);

// Campaigns
router.get('/campaigns', getAllCampaigns);

// Settings management
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

export default router;