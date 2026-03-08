const mongoose = require('mongoose');

const TransparencyReportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  reportType: {
    type: String,
    required: true,
    enum: [
      'transparency_seal', 'full_disclosure', 'annual_budget',
      'annual_procurement', 'bid_results', 'financial_report',
      'aip', 'quarterly_report', 'coa_report', 'other'
    ]
  },
  fiscalYear: { type: Number, required: true },
  quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4', 'annual', ''], default: '' },
  description: { type: String, default: '' },
  filePath: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

TransparencyReportSchema.index({ reportType: 1, fiscalYear: -1 });

module.exports = mongoose.model('TransparencyReport', TransparencyReportSchema);
