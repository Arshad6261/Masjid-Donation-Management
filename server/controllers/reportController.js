import Donation from '../models/Donation.js';
import Expenditure from '../models/Expenditure.js';
import Donor from '../models/Donor.js';

// @desc    Get dashboard metrics (totals)
// @route   GET /api/reports/dashboard
export const getDashboardMetrics = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Total Donations by Fund Type (Overall)
    const donationsByFund = await Donation.aggregate([
      { $group: { _id: '$fundType', total: { $sum: '$amount' } } }
    ]);
    
    let totals = { masjid: 0, dargah: 0, festival: 0, jumma_jholi: 0, tamiri_kaam: 0 };
    donationsByFund.forEach(d => totals[d._id] = d.total);

    // Total Expenses by Fund Type (Overall)
    const expensesByFund = await Expenditure.aggregate([
      { $group: { _id: '$fundType', total: { $sum: '$amount' } } }
    ]);
    
    let expenseTotals = { masjid: 0, dargah: 0, festival: 0, jumma_jholi: 0, tamiri_kaam: 0 };
    expensesByFund.forEach(e => expenseTotals[e._id] = e.total);

    // This month overall collections vs expenses
    const thisMonthDonations = await Donation.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const thisMonthExpenseObj = await Expenditure.aggregate([
      { 
        $match: { 
          expenseDate: { 
            $gte: new Date(currentYear, currentMonth - 1, 1),
            $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59)
          } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      funds: totals,
      expenses: expenseTotals,
      thisMonthCollected: thisMonthDonations.length ? thisMonthDonations[0].total : 0,
      thisMonthExpense: thisMonthExpenseObj.length ? thisMonthExpenseObj[0].total : 0,
      balances: {
        masjid: totals.masjid - expenseTotals.masjid,
        dargah: totals.dargah - expenseTotals.dargah,
        festival: totals.festival - expenseTotals.festival,
        jumma_jholi: totals.jumma_jholi - expenseTotals.jumma_jholi,
        tamiri_kaam: totals.tamiri_kaam - expenseTotals.tamiri_kaam
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly donation breakdown
// @route   GET /api/reports/monthly?year=
export const getMonthlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ message: 'Year is required' });

    const report = await Donation.aggregate([
      { $match: { year: parseInt(year) } },
      { $group: { _id: { month: '$month', fundType: '$fundType' }, total: { $sum: '$amount' } } },
      { $sort: { '_id.month': 1 } }
    ]);

    // Format for frontend Recharts: [{ name: "Jan", masjid: 100, dargah: 50 }, ...]
    const formatted = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, masjid: 0, dargah: 0, festival: 0 }));
    report.forEach(item => {
      const idx = item._id.month - 1;
      formatted[idx][item._id.fundType] = item.total;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get defaulters (donors who haven't paid this month)
// @route   GET /api/reports/defaulters?month=&year=
export const getDefaulters = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: 'Month and year required' });

    // Find all active donors
    const activeDonors = await Donor.find({ isActive: true });
    
    // Find all donations for this month
    const donationsThisMonth = await Donation.find({ month: parseInt(month), year: parseInt(year) }).select('donor amount');
    const donatedDonorIds = donationsThisMonth.map(d => d.donor.toString());

    // Defaulters = Active Donors NOT in donationsThisMonth
    const defaulters = activeDonors.filter(donor => !donatedDonorIds.includes(donor._id.toString()));

    res.json(defaulters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comprehensive yearly report
// @route   GET /api/reports/yearly?year=YYYY
export const getYearlyReport = async (req, res) => {
  try {
    const yr = parseInt(req.query.year) || new Date().getFullYear();

    // 1. Month-by-month donations grouped by fund
    const monthlyDonations = await Donation.aggregate([
      { $match: { year: yr } },
      { $group: { _id: { month: '$month', fundType: '$fundType' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } }
    ]);

    // 2. Month-by-month expenses grouped by fund
    const startOfYear = new Date(yr, 0, 1);
    const endOfYear = new Date(yr, 11, 31, 23, 59, 59);
    const monthlyExpenses = await Expenditure.aggregate([
      { $match: { expenseDate: { $gte: startOfYear, $lte: endOfYear } } },
      { $addFields: { expMonth: { $month: '$expenseDate' } } },
      { $group: { _id: { month: '$expMonth', fundType: '$fundType' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } }
    ]);

    // Build 12-month rows
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      collections: { masjid: 0, dargah: 0, festival: 0, total: 0 },
      expenses: { masjid: 0, dargah: 0, festival: 0, total: 0 },
      balance: 0,
      donationCount: 0
    }));

    monthlyDonations.forEach(d => {
      const m = months[d._id.month - 1];
      m.collections[d._id.fundType] = d.total;
      m.collections.total += d.total;
      m.donationCount += d.count;
    });

    monthlyExpenses.forEach(e => {
      const m = months[e._id.month - 1];
      m.expenses[e._id.fundType] = e.total;
      m.expenses.total += e.total;
    });

    months.forEach(m => { m.balance = m.collections.total - m.expenses.total; });

    // 3. Fund-wise annual totals
    const annualCollections = { masjid: 0, dargah: 0, festival: 0, total: 0 };
    const annualExpenses = { masjid: 0, dargah: 0, festival: 0, total: 0 };
    months.forEach(m => {
      ['masjid', 'dargah', 'festival'].forEach(f => {
        annualCollections[f] += m.collections[f];
        annualExpenses[f] += m.expenses[f];
      });
      annualCollections.total += m.collections.total;
      annualExpenses.total += m.expenses.total;
    });

    // 4. Donor stats
    const totalActiveDonors = await Donor.countDocuments({ isActive: true });
    const totalDonors = await Donor.countDocuments();
    const newDonorsThisYear = await Donor.countDocuments({
      createdAt: { $gte: startOfYear, $lte: endOfYear }
    });

    // 5. Unique donors who paid this year
    const uniquePayers = await Donation.distinct('donor', { year: yr });

    // 6. Top 10 donors by amount this year
    const topDonors = await Donation.aggregate([
      { $match: { year: yr } },
      { $group: { _id: '$donor', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'donors', localField: '_id', foreignField: '_id', as: 'donorInfo' } },
      { $unwind: '$donorInfo' },
      { $project: { _id: 1, totalAmount: 1, count: 1, name: '$donorInfo.name', area: '$donorInfo.area', phone: '$donorInfo.phone' } }
    ]);

    // 7. Expense category breakdown
    const expByCategory = await Expenditure.aggregate([
      { $match: { expenseDate: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // 8. Month-wise defaulter count
    const now = new Date();
    const currentMonth = now.getFullYear() === yr ? now.getMonth() + 1 : (yr < now.getFullYear() ? 12 : 0);
    const monthlyDefaulters = [];
    for (let m = 1; m <= Math.min(currentMonth, 12); m++) {
      const paidDonorIds = await Donation.distinct('donor', { month: m, year: yr });
      const defaulterCount = totalActiveDonors - paidDonorIds.length;
      monthlyDefaulters.push({ month: m, defaulters: Math.max(0, defaulterCount), paid: paidDonorIds.length });
    }

    // 9. Expected annual (active donors × monthly pledge × months elapsed)
    const expectedObj = await Donor.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalMonthly: { $sum: '$monthlyAmount' } } }
    ]);
    const monthlyExpected = expectedObj.length ? expectedObj[0].totalMonthly : 0;
    const expectedAnnual = monthlyExpected * currentMonth;
    const collectionRate = expectedAnnual > 0 ? Math.round((annualCollections.total / expectedAnnual) * 100) : 0;

    res.json({
      year: yr,
      months,
      annualCollections,
      annualExpenses,
      annualBalance: annualCollections.total - annualExpenses.total,
      donorStats: {
        totalDonors,
        totalActiveDonors,
        newDonorsThisYear,
        uniquePayers: uniquePayers.length,
        monthlyExpected,
        expectedAnnual,
        collectionRate
      },
      topDonors,
      expensesByCategory: expByCategory,
      monthlyDefaulters
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get festival summary
// @route   GET /api/reports/festival-summary
export const getFestivalSummary = async (req, res) => {
  try {
    const donations = await Donation.aggregate([
      { $match: { fundType: 'festival', festivalName: { $exists: true, $ne: '' } } },
      { $group: { 
          _id: { festivalName: '$festivalName', year: '$year' }, 
          totalDonations: { $sum: '$amount' },
          donationCount: { $sum: 1 }
      }}
    ]);

    const expenses = await Expenditure.aggregate([
      { $match: { fundType: 'festival', festivalName: { $exists: true, $ne: '' } } },
      { $addFields: { year: { $year: '$expenseDate' } } },
      { $group: {
          _id: { festivalName: '$festivalName', year: '$year' },
          totalExpenses: { $sum: '$amount' }
      }}
    ]);

    const resultMap = new Map();

    donations.forEach(d => {
      const key = `${d._id.festivalName}-${d._id.year}`;
      resultMap.set(key, {
        festivalName: d._id.festivalName,
        year: d._id.year,
        totalDonations: d.totalDonations,
        totalExpenses: 0,
        donationCount: d.donationCount,
        balance: d.totalDonations
      });
    });

    expenses.forEach(e => {
      const key = `${e._id.festivalName}-${e._id.year}`;
      if (resultMap.has(key)) {
        const item = resultMap.get(key);
        item.totalExpenses = e.totalExpenses;
        item.balance = item.totalDonations - e.totalExpenses;
      } else {
        resultMap.set(key, {
          festivalName: e._id.festivalName,
          year: e._id.year,
          totalDonations: 0,
          totalExpenses: e.totalExpenses,
          donationCount: 0,
          balance: -e.totalExpenses
        });
      }
    });

    const results = Array.from(resultMap.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return a.festivalName.localeCompare(b.festivalName);
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get collector stats (Leaderboard)
// @route   GET /api/reports/collector-stats
export const getCollectorStats = async (req, res) => {
  try {
    const d = new Date();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    const stats = await Donation.aggregate([
      { $match: { month, year } },
      { $group: { _id: '$collectedBy', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 1, name: '$user.name', totalAmount: 1, count: 1 } },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
