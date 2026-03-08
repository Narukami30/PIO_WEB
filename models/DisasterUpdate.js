const mongoose = require('mongoose');

const DisasterUpdateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  alertLevel: {
    type: String,
    required: true,
    enum: ['info', 'advisory', 'warning', 'critical'],
    default: 'info'
  },
  type: {
    type: String,
    enum: ['typhoon', 'flood', 'earthquake', 'fire', 'landslide', 'volcanic', 'pandemic', 'general'],
    default: 'general'
  },
  affectedBarangays: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false },
  attachments: [{ filename: String, path: String, originalName: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

DisasterUpdateSchema.index({ isActive: 1, isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('DisasterUpdate', DisasterUpdateSchema);
