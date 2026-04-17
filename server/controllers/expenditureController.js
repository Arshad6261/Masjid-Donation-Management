import Expenditure from '../models/Expenditure.js';

// @desc    Get all expenditures
// @route   GET /api/expenditures
export const getExpenditures = async (req, res) => {
  try {
    const { month, year, fundType, category } = req.query;
    let query = {};
    if (fundType) query.fundType = fundType;
    if (category) query.category = category;
    
    // For date filtering (month/year)
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.expenseDate = { $gte: startDate, $lte: endDate };
    }

    const expenditures = await Expenditure.find(query)
      .populate('approvedBy', 'name')
      .sort({ expenseDate: -1 });

    res.json(expenditures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an expenditure
// @route   POST /api/expenditures
export const createExpenditure = async (req, res) => {
  try {
    // multer might handle receiptPhoto upload here, or it's a URL/path passed in string
    const { fundType, festivalName, category, description, amount, expenseDate, vendor, receiptPhoto } = req.body;
    
    const expenditure = new Expenditure({
      fundType, festivalName, category, description, amount, expenseDate, vendor, receiptPhoto,
      approvedBy: req.user._id
    });
    
    const createdExp = await expenditure.save();
    res.status(201).json(createdExp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expenditure by ID
// @route   GET /api/expenditures/:id
export const getExpenditureById = async (req, res) => {
  try {
    const exp = await Expenditure.findById(req.params.id).populate('approvedBy', 'name');
    if (exp) {
      res.json(exp);
    } else {
      res.status(404).json({ message: 'Expenditure not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expenditure
// @route   PUT /api/expenditures/:id
export const updateExpenditure = async (req, res) => {
  try {
    const exp = await Expenditure.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Expenditure not found' });

    Object.assign(exp, req.body);
    const updatedExp = await exp.save();
    res.json(updatedExp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete expenditure
// @route   DELETE /api/expenditures/:id
export const deleteExpenditure = async (req, res) => {
  try {
    const exp = await Expenditure.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Expenditure not found' });

    await exp.deleteOne();
    res.json({ message: 'Expenditure removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
