import express from 'express';
import { getBudgets, setBudget, getBudgetVariance } from '../controllers/budgetController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getBudgets);
router.post('/', protect, admin, setBudget);
router.get('/variance', protect, admin, getBudgetVariance);

export default router;
