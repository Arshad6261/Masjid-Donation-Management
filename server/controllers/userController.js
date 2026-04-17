import User from '../models/User.js';
import Donation from '../models/Donation.js';

// @desc    Get all users (admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a user (admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, assignedAreas } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, phone, password, role: role || 'member', assignedAreas: assignedAreas || [] });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, assignedAreas: user.assignedAreas, isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user (admin only)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, assignedAreas, isActive, role } = req.body;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (assignedAreas) user.assignedAreas = assignedAreas;
    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;

    await user.save();
    const u = user.toObject();
    delete u.password;
    res.json(u);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = false;
    await user.save();
    res.json({ message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user stats
export const getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const donations = await Donation.find({
      collectedBy: req.params.id, month, year
    });
    res.json({
      donationsThisMonth: donations.length,
      amountThisMonth: donations.reduce((s, d) => s + d.amount, 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
