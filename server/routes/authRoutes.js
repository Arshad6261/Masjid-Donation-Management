import express from 'express';
import { loginUser, registerUser, getUserProfile, updateProfile, updatePassword } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', protect, admin, registerUser);
router.get('/me', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, updatePassword);

export default router;
