import express from 'express';
import {
  getAvailableSenderIds,
  getMySenderIds,
  purchaseSenderId,
  requestCustomSenderId,
  getMyRequests,
} from '../controllers/senderIdController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.use(protect);

router.get('/available', getAvailableSenderIds);
router.get('/mine', getMySenderIds);
router.post('/:id/purchase', purchaseSenderId);
router.post('/request', requestCustomSenderId);
router.get('/requests', getMyRequests);

export default router;
