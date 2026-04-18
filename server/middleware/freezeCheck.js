import SystemSetting from '../models/SystemSetting.js';

export const checkDonationFreeze = async (req, res, next) => {
  try {
    // Skip freeze check for admin users
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    const setting = await SystemSetting.findOne({ key: 'donationFreeze' });

    if (setting?.value?.isFrozen) {
      return res.status(403).json({
        error: 'DONATION_FROZEN',
        message: setting.value.reason || 'Donation operations are currently frozen by admin.',
        frozenAt: setting.value.frozenAt,
        frozenBy: setting.value.frozenByName
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking system settings' });
  }
};
