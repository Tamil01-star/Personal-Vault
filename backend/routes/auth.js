import express from 'express';
import { register, login, forgotPassword, resetPassword, changePassword, getStats, resetPasswordFirebase, updateProfile, resetPasswordFirebaseEmail } from '../controllers/authController.js';
import { verifyToken, authLimiter } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/reset-password-firebase', authLimiter, resetPasswordFirebase);
router.post('/reset-password-firebase-email', authLimiter, resetPasswordFirebaseEmail);

// Authenticated routes
router.post('/change-password', verifyToken, changePassword);
router.get('/stats', verifyToken, getStats);
router.put('/profile', verifyToken, updateProfile);

export default router;
