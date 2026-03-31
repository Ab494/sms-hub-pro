import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

export default router;
