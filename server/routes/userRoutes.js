import express from 'express';
import { getUsers, createUser, updateUser, deleteUser, getUserStats } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);

router.route('/:id')
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

router.get('/:id/stats', protect, admin, getUserStats);

export default router;
