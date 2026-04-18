import mongoose from 'mongoose';
import Counter from './Counter.js';

const donationSchema = new mongoose.Schema({
  receiptNo: { type: String, unique: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' }, // optional for walk-ins possibly, though our spec says relation is good
  amount: { type: Number, required: true },
  fundType: { type: String, enum: ['masjid', 'dargah', 'festival', 'jumma_jholi', 'tamiri_kaam'], required: true },
  festivalName: { type: String },
  month: { type: Number, min: 1, max: 12 },
  year: { type: Number },
  paymentDate: { type: Date, default: Date.now },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collectionMethod: { type: String, enum: ['house_visit', 'walk_in', 'bank_transfer'], default: 'walk_in' },
  notes: { type: String },
  receiptPrinted: { type: Boolean, default: false },
  
  // Feature 2: Advance Donation Fields
  isAdvance: { type: Boolean, default: false },
  advanceGroupId: { type: String }, // To link multiple receipts together
  totalMonths: { type: Number, default: 1 },
  batchIndex: { type: Number, default: 1 } // e.g. 1 of 5
}, { timestamps: true });

donationSchema.pre('save', async function() {
  if (this.isNew && !this.receiptNo) {
    const d = new Date(this.paymentDate || Date.now());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const counterId = `receiptNo-${yyyy}${mm}`;

    const counter = await Counter.findByIdAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    this.receiptNo = `RCP-${yyyy}${mm}-${counter.seq.toString().padStart(3, '0')}`;
  }
});

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
