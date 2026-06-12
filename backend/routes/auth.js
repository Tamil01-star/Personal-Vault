import express from 'express';
import { register, login, forgotPassword, resetPassword, changePassword, getStats } from '../controllers/authController.js';
import { verifyToken, authLimiter } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Authenticated routes
router.post('/change-password', verifyToken, changePassword);
router.get('/stats', verifyToken, getStats);

export default router;
