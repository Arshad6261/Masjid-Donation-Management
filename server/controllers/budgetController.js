import Budget from '../models/Budget.js';
import Expenditure from '../models/Expenditure.js';

// @desc    Get budgets
// @route   GET /api/budgets
export const getBudgets = async (req, res) => {
  try {
    const { month, year, fundType } = req.query;
    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (fundType) query.fundType = fundType;

    const budgets = await Budget.find(query).sort({ year: -1, month: -1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update budget
// @route   POST /api/budgets
export const setBudget = async (req, res) => {
  try {
    const { month, year, fundType, festivalName, items } = req.body;
    
    const totalBudgeted = items.reduce((s, i) => s + (Number(i.budgeted) || 0), 0);

    let budget = await Budget.findOne({ month, year, fundType });
    if (budget) {
      budget.items = items;
      budget.totalBudgeted = totalBudgeted;
      budget.festivalName = festivalName;
    } else {
      budget = new Budget({
        month, year, fundType, festivalName, items, totalBudgeted, createdBy: req.user._id
      });
    }
    
    await budget.save();
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get budget variance report
// @route   GET /api/budgets/variance
export const getBudgetVariance = async (req, res) => {
  try {
    const { month, year, fundType } = req.query;
    if (!month || !year || !fundType) return res.status(400).json({ message: 'Missing params' });

    const m = parseInt(month);
    const y = parseInt(year);

    const budget = await Budget.findOne({ month: m, year: y, fundType });
    
    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);

    const expenses = await Expenditure.aggregate([
      { $match: { fundType, expenseDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', actual: { $sum: '$amount' } } }
    ]);

    const actualMap = new Map();
    expenses.forEach(e => actualMap.set(e._id, e.actual));

    const variance = [];
    let totalBudgeted = 0;
    let totalSpent = 0;

    if (budget) {
      budget.items.forEach(item => {
        const actual = actualMap.get(item.category) || 0;
        const diff = item.budgeted - actual;
        let status = 'on_track';
        const ratio = item.budgeted > 0 ? actual / item.budgeted : (actual > 0 ? Infinity : 0);
        if (ratio < 0.85) status = 'under_budget';
        if (ratio > 1) status = 'over_budget';
        
        variance.push({
          category: item.category,
          label: item.label,
          budgeted: item.budgeted,
          actual,
          variance: diff,
          status
        });

        totalBudgeted += item.budgeted;
        totalSpent += actual;
        actualMap.delete(item.category);
      });
    }

    // Include expenses that weren't budgeted
    actualMap.forEach((actual, category) => {
      variance.push({
        category,
        label: category,
        budgeted: 0,
        actual,
        variance: -actual,
        status: 'over_budget'
      });
      totalSpent += actual;
    });

    res.json({
      budget,
      variance,
      totals: {
        budgeted: totalBudgeted,
        spent: totalSpent,
        remaining: totalBudgeted - totalSpent,
        status: totalSpent > totalBudgeted ? 'over_budget' : (totalSpent > totalBudgeted * 0.85 ? 'on_track' : 'under_budget')
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
