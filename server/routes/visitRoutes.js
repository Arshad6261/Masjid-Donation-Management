import express from 'express';
import { getVisits, createVisit, getVisitById, updateVisit, collectDonor, skipDonor } from '../controllers/visitController.js';
import { protect } from '../middleware/authMiddleware.js';
import { scopeToArea } from '../middleware/areaScope.js';
import { checkDonationFreeze } from '../middleware/freezeCheck.js';

const router = express.Router();

router.route('/')
  .get(protect, scopeToArea, getVisits)
  .post(protect, createVisit);

router.route('/:id')
  .get(protect, getVisitById)
  .put(protect, updateVisit);

router.patch('/:id/collect-donor', protect, checkDonationFreeze, collectDonor);
router.patch('/:id/skip-donor', protect, skipDonor);

export default router;
