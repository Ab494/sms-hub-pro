import express from 'express';
import {
  getCredits,
  getPricing,
  purchaseCredits,
  adjustCredits,
  getAllTransactions,
  initializeSettings,
  mpesaCallback,
  verifyPaymentStatus
} from '../controllers/creditsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/pricing', getPricing);
router.post('/callback', mpesaCallback); // M-Pesa webhook

// Protected routes - Users
router.use(protect);
router.get('/', getCredits);
router.post('/purchase', purchaseCredits);
router.post('/verify', verifyPaymentStatus);
router.get('/status/:checkoutRequestId', verifyPaymentStatus);

// Admin routes
router.post('/adjust', admin, adjustCredits);
router.get('/transactions', admin, getAllTransactions);
router.post('/initialize', admin, initializeSettings);

export default router;