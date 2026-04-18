import Notification from '../models/Notification.js';

// @desc    Get all notifications (paginated)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {}; // all roles can see notifications for now unless specifically restricted

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    // Map to include an isRead flag per current user
    const formatted = notifications.map(n => ({
      ...n.toObject(),
      isRead: n.readBy.some(id => id.toString() === req.user._id.toString())
    }));

    res.json({
      notifications: formatted,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    // Notifications where req.user._id is NOT in readBy
    const count = await Notification.countDocuments({
      readBy: { $ne: req.user._id }
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
