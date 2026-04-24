import mongoose from 'mongoose';
import Counter from './Counter.js';

const donorSchema = new mongoose.Schema({
  donorId: { type: String, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  address: {
    houseNo: String,
    street: String,
    area: String
  },
  area: { type: String, required: true },
  fundType: { type: String, enum: ['masjid', 'dargah', 'both'], required: true },
  monthlyAmount: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  pendingApproval: { type: Boolean, default: false },
  registrationSource: { type: String, enum: ['manual', 'qr_code', 'walk_in'], default: 'manual' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

donorSchema.pre('save', async function() {
  if (this.isNew && !this.donorId) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'donorId' },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    this.donorId = `HSP-${counter.seq.toString().padStart(4, '0')}`;
  }
});

const Donor = mongoose.model('Donor', donorSchema);
export default Donor;
