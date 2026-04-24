import Donation from '../models/Donation.js';
import Donor from '../models/Donor.js';

const anonymizeDonation = (don, role) => {
  let donation = don.toObject ? don.toObject() : { ...don };
  if (donation.isAnonymous && role !== 'admin') {
    if (donation.donor) {
      donation.donor.name = 'Anonymous Donor';
      donation.donor.phone = '';
      donation.donor.address = '';
    }
    donation.walkInDonorName = 'Anonymous Donor';
    donation.anonymized = true;
  }
  return donation;
};

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
      .populate('donor')
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 });
      
    res.json(donations.map(d => anonymizeDonation(d, req.user?.role)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a donation
// @route   POST /api/donations
export const createDonation = async (req, res) => {
  try {
    const { donor, amount, fundType, festivalName, month, year, paymentDate, collectionMethod, notes, isUnknownDonor, walkInDonorName, isAnonymous } = req.body;
    
    let actualDonor = donor;
    let isJummaTholi = false;

    if (fundType === 'jumma_tholi' || fundType === 'jumma_jholi') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can record Jumma Tholi.' });
      }
      isJummaTholi = true;
      actualDonor = undefined;
    } else if (isUnknownDonor) {
      actualDonor = undefined;
    } else if (!donor) {
      return res.status(400).json({ message: 'Donor is required.' });
    }

    const donation = new Donation({
      donor: actualDonor, amount, fundType, festivalName, month, year, paymentDate, collectionMethod, notes,
      collectedBy: req.user._id,
      isJummaTholi,
      isAnonymous: isAnonymous || false,
      walkInDonorName: isUnknownDonor ? walkInDonorName : undefined
    });
    const createdDonation = await donation.save();
    res.status(201).json(createdDonation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create advance donation (multiple months)
// @route   POST /api/donations/advance
export const createAdvanceDonation = async (req, res) => {
  try {
    const { donor, monthlyAmount, fundType, startMonth, startYear, totalMonths, collectionMethod, notes } = req.body;
    
    if (totalMonths < 2 || totalMonths > 12) {
      return res.status(400).json({ message: 'Advance donations must be between 2 and 12 months' });
    }

    const advanceGroupId = `ADV_${Date.now()}`;
    const createdDonations = [];
    
    let currentMonth = parseInt(startMonth);
    let currentYear = parseInt(startYear);

    // Save sequentially to trigger the pre-save hook for receipt numbers
    for (let i = 1; i <= totalMonths; i++) {
      const donation = new Donation({
        donor,
        amount: monthlyAmount,
        fundType,
        month: currentMonth,
        year: currentYear,
        paymentDate: new Date(),
        collectedBy: req.user._id,
        collectionMethod,
        notes: notes ? `${notes} (Advance)` : `Advance payment`,
        isAdvance: true,
        advanceGroupId,
        totalMonths,
        batchIndex: i
      });
      
      const saved = await donation.save();
      createdDonations.push(saved);

      currentMonth++;
      if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
      }
    }

    res.status(201).json({ 
      message: 'Advance donations created successfully', 
      groupId: advanceGroupId,
      donations: createdDonations 
    });
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
      res.json(anonymizeDonation(donation, req.user?.role));
    } else {
      res.status(404).json({ message: 'Donation not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search donations
// @route   GET /api/donations/search?q=
export const searchDonations = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    // We search by receiptNo (if starts with RCP-), otherwise by Donor phone, Donor Name
    // This requires populating first or searching Donor collection first.
    let donations = [];

    if (q.toUpperCase().startsWith('RCP-')) {
      donations = await Donation.find({ receiptNo: { $regex: new RegExp(q, 'i') } })
        .populate('donor')
        .populate('collectedBy', 'name')
        .limit(20);
    } else {
      // Find donors matching q
      const donors = await Donor.find({
        $or: [
          { name: { $regex: new RegExp(q, 'i') } },
          { phone: { $regex: new RegExp(q, 'i') } }
        ]
      }).select('_id');

      const donorIds = donors.map(d => d._id);

      donations = await Donation.find({ donor: { $in: donorIds } })
        .populate('donor')
        .populate('collectedBy', 'name')
        .sort({ paymentDate: -1 })
        .limit(30);
    }

    res.json(donations);
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
      res.json(anonymizeDonation(donation, req.user?.role));
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

// @desc    Get list of distinct festivals
// @route   GET /api/donations/festivals
export const getFestivals = async (req, res) => {
  try {
    const festivals = await Donation.distinct('festivalName', { fundType: 'festival' });
    res.json(festivals.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
