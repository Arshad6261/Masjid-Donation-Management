import Event from '../models/Event.js';

// @desc    Get all events
// @route   GET /api/events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
export const getUpcomingEvents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = await Event.find({ date: { $gte: today }, status: 'upcoming' }).sort({ date: 1 }).limit(5);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an event
// @route   POST /api/events
export const createEvent = async (req, res) => {
  try {
    const { title, date, location, description, fundType } = req.body;
    const event = new Event({ title, date, location, description, fundType, createdBy: req.user._id });
    const created = await event.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    Object.assign(event, req.body);
    const updated = await event.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.deleteOne();
    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
