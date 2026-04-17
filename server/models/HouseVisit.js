import mongoose from 'mongoose';

const houseVisitSchema = new mongoose.Schema({
  visitDate: { type: Date, required: true },
  area: { type: String, required: true },
  month: { type: Number },
  year: { type: Number },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorsVisited: [{
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
    donorName: String,
    phone: String,
    pledgedAmount: { type: Number, default: 0 },
    fundType: String,
    alreadyPaid: { type: Boolean, default: false },
    collected: { type: Boolean, default: false },
    collectedAmount: { type: Number, default: 0 },
    skipped: { type: Boolean, default: false },
    skipReason: { type: String, enum: ['not_home', 'postponed', 'other', ''] },
    collectedAt: Date,
    donationRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
    notes: { type: String }
  }],
  totalPledged: { type: Number, default: 0 },
  totalCollected: { type: Number, default: 0 },
  status: { type: String, enum: ['planned', 'in_progress', 'completed'], default: 'planned' }
}, { timestamps: true });

const HouseVisit = mongoose.model('HouseVisit', houseVisitSchema);
export default HouseVisit;
