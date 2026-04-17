import express from 'express';
import { loginUser, registerUser, getUserProfile } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', protect, admin, registerUser);
router.get('/me', protect, getUserProfile);

export default router;
