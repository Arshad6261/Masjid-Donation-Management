import express from 'express';
import { getDonors, createDonor, getDonorById, updateDonor, deleteDonor, getDonorDonationHistory, getDonorYearlyLedger, getDonorAreas } from '../controllers/donorController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { scopeToArea } from '../middleware/areaScope.js';

const router = express.Router();

router.route('/')
  .get(protect, scopeToArea, getDonors)
  .post(protect, createDonor);

router.get('/areas', protect, getDonorAreas);

router.route('/:id')
  .get(protect, getDonorById)
  .put(protect, updateDonor)
  .delete(protect, admin, deleteDonor);

router.get('/:id/donation-history', protect, getDonorDonationHistory);
router.get('/:id/yearly-ledger', protect, getDonorYearlyLedger);

export default router;
