import mongoose from 'mongoose';

const expenditureSchema = new mongoose.Schema({
  expenseId: { type: String, unique: true }, // Auto-generated or uuid
  fundType: { type: String, enum: ['masjid', 'dargah', 'festival', 'jumma_jholi', 'tamiri_kaam'], required: true },
  festivalName: { type: String }, // if fundType === 'festival'
  category: { 
    type: String, 
    required: true
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  expenseDate: { type: Date, required: true, default: Date.now },
  vendor: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiptPhoto: { type: String }, // optional file path
}, { timestamps: true });

// Pre-save to auto-generate expenseId if needed (e.g. EXP-YYYYMM-XXX)
// For now, simpler ID logic or let frontend pass it, but spec says "auto-generated" so let's just make it a random string or let mongodb use _id primarily. 
// We will generate it using timestamp for simplicity, or we can use Counter.
expenditureSchema.pre('save', function() {
  if (this.isNew && !this.expenseId) {
    this.expenseId = `EXP-${Date.now()}`;
  }
});

const Expenditure = mongoose.model('Expenditure', expenditureSchema);
export default Expenditure;
