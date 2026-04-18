import SystemSetting from '../models/SystemSetting.js';
import Notification from '../models/Notification.js';

// @desc    Freeze all donation write ops
// @route   POST /api/admin/freeze-donations
// @access  Private/Admin
export const freezeDonations = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Update setting
    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'donationFreeze' },
      {
        value: {
          isFrozen: true,
          reason,
          frozenAt: new Date(),
          frozenBy: req.user._id,
          frozenByName: req.user.name
        },
        updatedBy: req.user._id,
        updatedAt: Date.now()
      },
      { new: true, upsert: true }
    );

    // Create Notification
    await Notification.create({
      type: 'freeze',
      title: 'Donations Frozen',
      message: `Admin froze donations: "${reason || 'System Audit'}"`,
      createdBy: req.user._id
    });

    res.json({ message: 'Donations frozen', setting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unfreeze donation write ops
// @route   POST /api/admin/unfreeze-donations
// @access  Private/Admin
export const unfreezeDonations = async (req, res) => {
  try {
    // Update setting
    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'donationFreeze' },
      {
        value: { isFrozen: false, reason: '', frozenAt: null },
        updatedBy: req.user._id,
        updatedAt: Date.now()
      },
      { new: true, upsert: true }
    );

    // Create Notification
    await Notification.create({
      type: 'unfreeze',
      title: 'Donations Active',
      message: 'Donation operations have been resumed by admin.',
      createdBy: req.user._id
    });

    res.json({ message: 'Donations unfrozen', setting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current freeze status
// @route   GET /api/admin/freeze-status
// @access  Private
export const getFreezeStatus = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: 'donationFreeze' });
    res.json(setting?.value || { isFrozen: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
