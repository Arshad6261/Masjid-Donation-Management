import express from 'express';
import { 
  getDashboardMetrics, getMonthlyReport, getDefaulters, getYearlyReport, getFestivalSummary, getCollectorStats, getCollectorStatsByUser
} from '../controllers/reportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardMetrics);
router.get('/monthly', protect, getMonthlyReport);
router.get('/defaulters', protect, getDefaulters);
router.get('/yearly', protect, getYearlyReport);
router.get('/festival-summary', protect, getFestivalSummary);
router.get('/collector-stats', protect, getCollectorStats);
router.get('/collector-stats/:userId', protect, admin, getCollectorStatsByUser);

export default router;
