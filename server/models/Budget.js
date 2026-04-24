import mongoose from 'mongoose';

const budgetItemSchema = new mongoose.Schema({
  category: { type: String, required: true },
  label: { type: String },
  budgeted: { type: Number, required: true, default: 0 }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  fundType: { type: String, enum: ['masjid', 'dargah', 'festival', 'jumma_jholi', 'tamiri_kaam'], required: true },
  festivalName: { type: String },
  items: [budgetItemSchema],
  totalBudgeted: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

budgetSchema.index({ month: 1, year: 1, fundType: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
