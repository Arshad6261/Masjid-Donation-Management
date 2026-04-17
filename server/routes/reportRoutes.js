import express from 'express';
import { 
  getDashboardMetrics, getMonthlyReport, getDefaulters, getYearlyReport 
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardMetrics);
router.get('/monthly', protect, getMonthlyReport);
router.get('/defaulters', protect, getDefaulters);
router.get('/yearly', protect, getYearlyReport);

export default router;
