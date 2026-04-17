import express from 'express';
import { 
  getExpenditures, createExpenditure, getExpenditureById, updateExpenditure, deleteExpenditure 
} from '../controllers/expenditureController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getExpenditures)
  .post(protect, createExpenditure);

router.route('/:id')
  .get(protect, getExpenditureById)
  .put(protect, admin, updateExpenditure)
  .delete(protect, admin, deleteExpenditure);

export default router;
