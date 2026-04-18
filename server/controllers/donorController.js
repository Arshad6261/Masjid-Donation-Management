import Donor from '../models/Donor.js';
import Donation from '../models/Donation.js';

// @desc    Get all donors (area-scoped)
// @route   GET /api/donors
export const getDonors = async (req, res) => {
  try {
    const { area, fundType, isActive, search } = req.query;
    let query = { ...req.areaFilter };
    if (area) query.area = area;
    if (fundType) query.fundType = fundType;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { donorId: { $regex: search, $options: 'i' } }
      ];
    }
    const donors = await Donor.find(query).sort({ createdAt: -1 });
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all distinct areas from donors
// @route   GET /api/donors/areas
export const getDonorAreas = async (req, res) => {
  try {
    const areas = await Donor.distinct('area');
    res.json(areas.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a donor
export const createDonor = async (req, res) => {
  try {
    const { name, phone, address, area, fundType, monthlyAmount, isActive } = req.body;
    const donor = new Donor({
      name, phone, address, area, fundType, monthlyAmount, isActive,
      createdBy: req.user._id
    });
    const createdDonor = await donor.save();
    res.status(201).json(createdDonor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donor by ID
export const getDonorById = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (donor) {
      res.json(donor);
    } else {
      res.status(404).json({ message: 'Donor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update donor
export const updateDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    Object.assign(donor, req.body);
    const updatedDonor = await donor.save();
    res.json(updatedDonor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete (soft deactivate) donor
export const deleteDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    donor.isActive = false;
    await donor.save();
    res.json({ message: 'Donor deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donor donation history
export const getDonorDonationHistory = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.params.id })
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donor yearly ledger
// @route   GET /api/donors/:id/yearly-ledger?year=YYYY
export const getDonorYearlyLedger = async (req, res) => {
  try {
    const { year } = req.query;
    const yr = parseInt(year) || new Date().getFullYear();
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    const donations = await Donation.find({
      donor: donor._id,
      year: yr
    }).populate('collectedBy', 'name').sort({ month: 1 });

    const now = new Date();
    const currentMonth = now.getFullYear() === yr ? now.getMonth() + 1 : (yr < now.getFullYear() ? 12 : 0);
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const don = donations.find(d => d.month === m);
      let status = 'future';
      if (m <= currentMonth) {
        if (!don) {
          status = 'unpaid';
        } else if (don.amount >= donor.monthlyAmount) {
          status = don.amount > donor.monthlyAmount ? 'overpaid' : 'paid';
        } else {
          status = 'partial';
        }
      }
      return {
        month: m,
        monthName: monthNames[i],
        status,
        paidAmount: don ? don.amount : 0,
        pledgedAmount: donor.monthlyAmount,
        donation: don ? {
          _id: don._id,
          receiptNo: don.receiptNo,
          paymentDate: don.paymentDate,
          collectedBy: don.collectedBy
        } : null
      };
    });

    const paidMonths = months.filter(m => ['paid', 'overpaid'].includes(m.status)).length;
    const unpaidMonths = months.filter(m => m.status === 'unpaid').length;
    const totalPaid = months.reduce((s, m) => s + m.paidAmount, 0);
    const totalPledged = currentMonth * donor.monthlyAmount;

    res.json({
      donor: {
        _id: donor._id, name: donor.name, phone: donor.phone,
        area: donor.area, monthlyAmount: donor.monthlyAmount, fundType: donor.fundType
      },
      year: yr,
      months,
      summary: {
        totalPledged,
        totalPaid,
        totalOutstanding: Math.max(0, totalPledged - totalPaid),
        paidMonths,
        unpaidMonths,
        consistency: currentMonth > 0 ? Math.round((paidMonths / currentMonth) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
