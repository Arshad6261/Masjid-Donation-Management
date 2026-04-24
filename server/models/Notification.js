import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['freeze', 'unfreeze', 'system', 'info', 'qr_registration'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
