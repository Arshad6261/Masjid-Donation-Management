import express from 'express';
import { 
  getDonations, createDonation, getDonationById, updateDonation, deleteDonation, getDonationByReceipt, getMonthlySummary 
} from '../controllers/donationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getDonations)
  .post(protect, createDonation);

router.get('/monthly-summary', protect, getMonthlySummary);
router.get('/receipt/:receiptNo', protect, getDonationByReceipt);

router.route('/:id')
  .get(protect, getDonationById)
  .put(protect, updateDonation)
  .delete(protect, admin, deleteDonation);

export default router;
