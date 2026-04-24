import express from 'express';
import { getEvents, getUpcomingEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getEvents);
router.get('/upcoming', protect, getUpcomingEvents);
router.post('/', protect, admin, createEvent);
router.put('/:id', protect, admin, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);

export default router;
