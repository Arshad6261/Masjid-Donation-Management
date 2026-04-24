import express from 'express';
import { getDonors, createDonor, getDonorById, updateDonor, deleteDonor, getDonorDonationHistory, getDonorYearlyLedger, getDonorAreas, selfRegister, generateQRCode, approveDonor, rejectDonor } from '../controllers/donorController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { scopeToArea } from '../middleware/areaScope.js';

const router = express.Router();

router.post('/self-register', selfRegister);
router.get('/areas', getDonorAreas);
router.get('/qr-code', protect, admin, generateQRCode);

router.route('/')
  .get(protect, scopeToArea, getDonors)
  .post(protect, createDonor);

router.patch('/:id/approve', protect, admin, approveDonor);
router.patch('/:id/reject', protect, admin, rejectDonor);

router.route('/:id')
  .get(protect, getDonorById)
  .put(protect, updateDonor)
  .delete(protect, admin, deleteDonor);

router.get('/:id/donation-history', protect, getDonorDonationHistory);
router.get('/:id/yearly-ledger', protect, getDonorYearlyLedger);

export default router;
