const mongoose = require('mongoose');
const slugify = require('slugify');

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, default: '' },
  category: {
    type: String,
    required: true,
    enum: ['general', 'notice', 'advisory', 'ordinance', 'resolution', 'executive_order', 'procurement', 'jobs', 'other']
  },
  image: { type: String, default: '' },
  attachments: [{ filename: String, path: String, originalName: String }],
  isPinned: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 }
}, { timestamps: true });

AnnouncementSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

AnnouncementSchema.index({ isPublished: 1, publishedAt: -1 });
AnnouncementSchema.index({ category: 1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
