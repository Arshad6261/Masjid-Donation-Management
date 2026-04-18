import express from 'express';
import { freezeDonations, unfreezeDonations, getFreezeStatus } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/freeze-donations', protect, admin, freezeDonations);
router.post('/unfreeze-donations', protect, admin, unfreezeDonations);
router.get('/freeze-status', protect, getFreezeStatus);

export default router;
