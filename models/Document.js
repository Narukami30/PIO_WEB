const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    required: true,
    enum: ['ordinance', 'resolution', 'executive_order', 'citizen_charter', 'forms', 'reports', 'permits', 'other']
  },
  filePath: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  fileType: { type: String, default: '' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  isPublished: { type: Boolean, default: false },
  downloads: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

DocumentSchema.index({ category: 1, isPublished: 1 });

module.exports = mongoose.model('Document', DocumentSchema);
