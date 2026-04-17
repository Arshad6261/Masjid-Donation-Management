import HouseVisit from '../models/HouseVisit.js';
import Donor from '../models/Donor.js';
import Donation from '../models/Donation.js';

// @desc    Get all visits (area-scoped)
export const getVisits = async (req, res) => {
  try {
    const visits = await HouseVisit.find({ ...req.areaFilter })
      .populate('collectedBy', 'name')
      .sort({ visitDate: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a visit — auto-populate donor list
export const createVisit = async (req, res) => {
  try {
    const { area, visitDate } = req.body;
    const now = new Date(visitDate || Date.now());
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const donorsInArea = await Donor.find({ area, isActive: true });

    // Find already paid donors this month
    const donorIds = donorsInArea.map(d => d._id);
    const paidDonations = await Donation.find({
      donor: { $in: donorIds }, month, year
    }).select('donor amount');
    const paidMap = {};
    paidDonations.forEach(d => { paidMap[d.donor.toString()] = d.amount; });

    const totalPledged = donorsInArea.reduce((s, d) => s + d.monthlyAmount, 0);
    const donorsVisited = donorsInArea.map(d => ({
      donor: d._id,
      donorName: d.name,
      phone: d.phone || '',
      pledgedAmount: d.monthlyAmount,
      fundType: d.fundType,
      alreadyPaid: !!paidMap[d._id.toString()],
      collected: false,
      collectedAmount: 0,
      skipped: false,
      skipReason: '',
      notes: ''
    }));

    const visit = new HouseVisit({
      visitDate, area, month, year,
      collectedBy: req.user._id,
      donorsVisited,
      totalPledged
    });
    const createdVisit = await visit.save();
    res.status(201).json(createdVisit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get visit by ID
export const getVisitById = async (req, res) => {
  try {
    const visit = await HouseVisit.findById(req.params.id)
      .populate('collectedBy', 'name')
      .populate('donorsVisited.donor', 'name phone address area monthlyAmount fundType');
    if (visit) {
      res.json(visit);
    } else {
      res.status(404).json({ message: 'Visit not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update visit
export const updateVisit = async (req, res) => {
  try {
    const { status, donorsVisited, totalCollected } = req.body;
    const visit = await HouseVisit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    if (status) visit.status = status;
    if (donorsVisited) visit.donorsVisited = donorsVisited;
    if (totalCollected !== undefined) visit.totalCollected = totalCollected;

    const updatedVisit = await visit.save();
    res.json(updatedVisit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Collect from a specific donor during a visit
// @route   PATCH /api/visits/:id/collect-donor
export const collectDonor = async (req, res) => {
  try {
    const { donorIndex, amount, notes, paymentDate } = req.body;
    const visit = await HouseVisit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    const entry = visit.donorsVisited[donorIndex];
    if (!entry) return res.status(400).json({ message: 'Invalid donor index' });

    // Create the donation record
    const donation = new Donation({
      donor: entry.donor,
      amount,
      fundType: entry.fundType || 'masjid',
      month: visit.month || new Date().getMonth() + 1,
      year: visit.year || new Date().getFullYear(),
      paymentDate: paymentDate || new Date(),
      collectedBy: req.user._id,
      collectionMethod: 'house_visit',
      notes: notes || ''
    });
    const savedDonation = await donation.save();

    // Update visit entry
    entry.collected = true;
    entry.collectedAmount = amount;
    entry.collectedAt = new Date();
    entry.donationRef = savedDonation._id;
    entry.notes = notes || '';

    // Recalculate total
    visit.totalCollected = visit.donorsVisited.reduce(
      (s, d) => s + (d.collected ? d.collectedAmount : 0), 0
    );
    visit.status = 'in_progress';
    await visit.save();

    res.json({ visit, donation: savedDonation, receiptNo: savedDonation.receiptNo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Skip a donor during a visit
// @route   PATCH /api/visits/:id/skip-donor
export const skipDonor = async (req, res) => {
  try {
    const { donorIndex, skipReason } = req.body;
    const visit = await HouseVisit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    const entry = visit.donorsVisited[donorIndex];
    if (!entry) return res.status(400).json({ message: 'Invalid donor index' });

    entry.skipped = true;
    entry.skipReason = skipReason || 'other';
    visit.status = 'in_progress';
    await visit.save();

    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
