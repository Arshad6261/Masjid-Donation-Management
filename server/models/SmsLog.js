import mongoose from 'mongoose';

const smsLogSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  message: { type: String, required: true },
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
  type: { type: String, enum: ['donation_receipt', 'reminder', 'test', 'other'], default: 'donation_receipt' },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  errorMessage: { type: String },
  sentVia: { type: String, enum: ['sms', 'whatsapp', 'both'], default: 'sms' },
  createdAt: { type: Date, default: Date.now }
});

const SmsLog = mongoose.model('SmsLog', smsLogSchema);
export default SmsLog;
