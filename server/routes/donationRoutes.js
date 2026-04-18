import express from 'express';
import { 
  getDonations, createDonation, createAdvanceDonation, getDonationById, updateDonation, deleteDonation, getDonationByReceipt, getMonthlySummary, searchDonations 
} from '../controllers/donationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { checkDonationFreeze } from '../middleware/freezeCheck.js';

const router = express.Router();

router.route('/')
  .get(protect, getDonations)
  .post(protect, checkDonationFreeze, createDonation);

router.post('/advance', protect, checkDonationFreeze, createAdvanceDonation);

router.get('/search', protect, searchDonations);
router.get('/monthly-summary', protect, getMonthlySummary);
router.get('/receipt/:receiptNo', protect, getDonationByReceipt);

router.route('/:id')
  .get(protect, getDonationById)
  .put(protect, checkDonationFreeze, updateDonation)
  .delete(protect, admin, checkDonationFreeze, deleteDonation);

export default router;
