import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { sendSMS, sendDonationReceiptSMS, buildSmsMessage } from '../services/smsService.js';
import Donation from '../models/Donation.js';
import SmsLog from '../models/SmsLog.js';
import SystemSetting from '../models/SystemSetting.js';

const router = express.Router();

// @desc    Send test SMS
// @route   POST /api/sms/test
router.post('/test', protect, admin, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number required' });
    const result = await sendSMS({
      phone,
      message: 'हज़रत सुल्तान शाह पीर मस्जिद व दरगाह — टेस्ट SMS। यदि आपको यह मिला तो SMS सेवा काम कर रही है!',
      type: 'test'
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Manually trigger SMS for a donation
// @route   POST /api/sms/send-receipt
router.post('/send-receipt', protect, async (req, res) => {
  try {
    const { donationId } = req.body;
    if (!donationId) return res.status(400).json({ message: 'donationId required' });

    const donation = await Donation.findById(donationId)
      .populate('donor')
      .populate('collectedBy', 'name');

    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (!donation.donor?.phone) return res.status(400).json({ message: 'Donor has no phone number' });

    // Check if already sent
    const alreadySent = await SmsLog.findOne({
      donationId: donation._id,
      status: 'sent',
      type: 'donation_receipt'
    });
    if (alreadySent) return res.json({ alreadySent: true, message: 'SMS already sent for this donation' });

    const result = await sendDonationReceiptSMS(donation);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get SMS logs (admin)
// @route   GET /api/sms/logs
router.get('/logs', protect, admin, async (req, res) => {
  try {
    const { status, type, from, to, page = 1 } = req.query;
    const limit = 30;
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const total = await SmsLog.countDocuments(query);
    const logs = await SmsLog.find(query)
      .populate('donorId', 'name phone')
      .populate('donationId', 'receiptNo amount')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get SMS settings
// @route   GET /api/sms/settings
router.get('/settings', protect, admin, async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: 'smsSettings' });
    res.json(setting?.value || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update SMS settings
// @route   PUT /api/sms/settings
router.put('/settings', protect, admin, async (req, res) => {
  try {
    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'smsSettings' },
      { $set: { value: { ...req.body }, updatedBy: req.user._id, updatedAt: new Date() } },
      { new: true, upsert: true }
    );
    res.json(setting.value);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get SMS stats for this month
// @route   GET /api/sms/stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [sent, failed] = await Promise.all([
      SmsLog.countDocuments({ status: 'sent', createdAt: { $gte: startOfMonth } }),
      SmsLog.countDocuments({ status: 'failed', createdAt: { $gte: startOfMonth } })
    ]);
    const total = sent + failed;
    res.json({
      sent, failed,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      estimatedCost: (sent * 0.15).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
