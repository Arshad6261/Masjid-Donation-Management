import Donation from '../models/Donation.js';
import Donor from '../models/Donor.js';

// @desc    Get all donations
// @route   GET /api/donations
export const getDonations = async (req, res) => {
  try {
    const { month, year, fundType, donorId, collectedBy } = req.query;
    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (fundType) query.fundType = fundType;
    if (donorId) query.donor = donorId;
    if (collectedBy) query.collectedBy = collectedBy;

    const donations = await Donation.find(query)
      .populate('donor', 'name phone area')
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a donation
// @route   POST /api/donations
export const createDonation = async (req, res) => {
  try {
    const { donor, amount, fundType, festivalName, month, year, paymentDate, collectionMethod, notes } = req.body;
    const donation = new Donation({
      donor, amount, fundType, festivalName, month, year, paymentDate, collectionMethod, notes,
      collectedBy: req.user._id
    });
    const createdDonation = await donation.save();
    res.status(201).json(createdDonation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
export const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor')
      .populate('collectedBy', 'name');
    if (donation) {
      res.json(donation);
    } else {
      res.status(404).json({ message: 'Donation not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donation by receipt Number
// @route   GET /api/donations/receipt/:receiptNo
export const getDonationByReceipt = async (req, res) => {
  try {
    const donation = await Donation.findOne({ receiptNo: req.params.receiptNo })
      .populate('donor')
      .populate('collectedBy', 'name');
    if (donation) {
      res.json(donation);
    } else {
      res.status(404).json({ message: 'Receipt not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update donation
// @route   PUT /api/donations/:id
export const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    Object.assign(donation, req.body);
    const updatedDonation = await donation.save();
    res.json(updatedDonation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete donation
// @route   DELETE /api/donations/:id
export const deleteDonation = async (req, res) => {
  try { // Only admin usually deletes financials
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    await donation.deleteOne();
    res.json({ message: 'Donation removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly summary (collected/expected)
// @route   GET /api/donations/monthly-summary?month=&year=
export const getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: 'Month and year required' });

    // Sum of donations this month
    const totalCollectedObj = await Donation.aggregate([
      { $match: { month: parseInt(month), year: parseInt(year) } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCollected = totalCollectedObj.length > 0 ? totalCollectedObj[0].total : 0;

    // Expected from active donors
    const expectedObj = await Donor.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$monthlyAmount' } } }
    ]);
    const totalExpected = expectedObj.length > 0 ? expectedObj[0].total : 0;

    res.json({
      collected: totalCollected,
      expected: totalExpected,
      remaining: Math.max(0, totalExpected - totalCollected)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
