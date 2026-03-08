const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  citizenName: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  barangay: { type: String, default: '' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['infrastructure', 'public_service', 'health', 'peace_and_order', 'environment', 'corruption', 'other'],
    default: 'other'
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  trackingCode: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'],
    default: 'submitted'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  attachments: [{ filename: String, path: String, originalName: String }],
  updates: [{
    status: String,
    message: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date }
}, { timestamps: true });

ComplaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', ComplaintSchema);
