const mongoose = require('mongoose');
const slugify = require('slugify');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  location: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  image: { type: String, default: '' },
  category: {
    type: String,
    enum: ['fiesta', 'meeting', 'seminar', 'sports', 'health', 'outreach', 'ceremony', 'other'],
    default: 'other'
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  isPublished: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

EventSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  next();
});

EventSchema.index({ isPublished: 1, startDate: -1 });

module.exports = mongoose.model('Event', EventSchema);
