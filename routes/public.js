const router = require('express').Router();
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const Document = require('../models/Document');
const TransparencyReport = require('../models/TransparencyReport');
const Service = require('../models/Service');
const Department = require('../models/Department');
const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const DisasterUpdate = require('../models/DisasterUpdate');
const SiteSettings = require('../models/SiteSettings');
const { generateTrackingCode, formatDate, truncate, formatFileSize, alertLevelClass, statusBadgeClass } = require('../utils/helpers');
const { feedbackRules, complaintRules, validateRequest } = require('../middleware/validators');

// Make helpers available in all public views
router.use((req, res, next) => {
  res.locals.formatDate = formatDate;
  res.locals.truncate = truncate;
  res.locals.formatFileSize = formatFileSize;
  res.locals.alertLevelClass = alertLevelClass;
  res.locals.statusBadgeClass = statusBadgeClass;
  next();
});

// Home
router.get('/', async (req, res) => {
  try {
    const [announcements, events, disasterUpdates, siteSettings] = await Promise.all([
      Announcement.find({ isPublished: true }).sort({ isPinned: -1, publishedAt: -1 }).limit(6),
      Event.find({ isPublished: true, startDate: { $gte: new Date() } }).sort({ startDate: 1 }).limit(4),
      DisasterUpdate.find({ isPublished: true, isActive: true }).sort({ createdAt: -1 }).limit(3),
      SiteSettings.getSettings()
    ]);

    res.render('public/home', {
      layout: 'layouts/main',
      title: 'Home',
      announcements, events, disasterUpdates, siteSettings
    });
  } catch (err) {
    console.error(err);
    res.render('public/home', { layout: 'layouts/main', title: 'Home', announcements: [], events: [], disasterUpdates: [], siteSettings: {} });
  }
});

// Announcements
router.get('/announcements', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;

    const [announcements, total] = await Promise.all([
      Announcement.find(filter).sort({ isPinned: -1, publishedAt: -1 }).skip(skip).limit(limit),
      Announcement.countDocuments(filter)
    ]);

    res.render('public/announcements', {
      layout: 'layouts/main',
      title: 'Announcements',
      announcements, current: page,
      pages: Math.ceil(total / limit),
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.render('public/announcements', { layout: 'layouts/main', title: 'Announcements', announcements: [], current: 1, pages: 0, query: {} });
  }
});

// Single announcement
router.get('/announcements/:slug', async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ slug: req.params.slug, isPublished: true })
      .populate('department', 'name')
      .populate('createdBy', 'firstName lastName');
    if (!announcement) return res.status(404).render('errors/404', { layout: 'layouts/main', title: 'Not Found' });

    announcement.views += 1;
    await announcement.save();

    const related = await Announcement.find({
      isPublished: true, category: announcement.category, _id: { $ne: announcement._id }
    }).limit(3).sort({ publishedAt: -1 });

    res.render('public/announcement-detail', {
      layout: 'layouts/main',
      title: announcement.title,
      announcement, related
    });
  } catch (err) {
    console.error(err);
    res.status(404).render('errors/404', { layout: 'layouts/main', title: 'Not Found' });
  }
});

// Transparency Seal
router.get('/transparency', async (req, res) => {
  try {
    const filter = { isPublished: true };
    if (req.query.type) filter.reportType = req.query.type;
    if (req.query.year) filter.fiscalYear = parseInt(req.query.year);

    const reports = await TransparencyReport.find(filter).sort({ fiscalYear: -1, createdAt: -1 });
    const years = await TransparencyReport.distinct('fiscalYear', { isPublished: true });

    res.render('public/transparency', {
      layout: 'layouts/main',
      title: 'Transparency Seal',
      reports, years: years.sort((a, b) => b - a),
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.render('public/transparency', { layout: 'layouts/main', title: 'Transparency', reports: [], years: [], query: {} });
  }
});

// Services / Citizen Charter
router.get('/services', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: searchRegex }, { description: searchRegex }];
    }
    const services = await Service.find(filter).populate('department', 'name').sort({ order: 1 });
    res.render('public/services', { layout: 'layouts/main', title: "Citizen's Charter - Services", services, query: req.query });
  } catch (err) {
    console.error(err);
    res.render('public/services', { layout: 'layouts/main', title: 'Services', services: [], query: {} });
  }
});

// Documents
router.get('/documents', async (req, res) => {
  try {
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;
    const documents = await Document.find(filter).populate('department', 'name').sort({ createdAt: -1 });
    res.render('public/documents', { layout: 'layouts/main', title: 'Documents & Downloads', documents, query: req.query });
  } catch (err) {
    console.error(err);
    res.render('public/documents', { layout: 'layouts/main', title: 'Documents', documents: [], query: {} });
  }
});

// Officials / Departments
router.get('/officials', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.render('public/officials', { layout: 'layouts/main', title: 'Officials & Departments', departments });
  } catch (err) {
    console.error(err);
    res.render('public/officials', { layout: 'layouts/main', title: 'Officials', departments: [] });
  }
});

// Contact
router.get('/contact', (req, res) => {
  res.render('public/contact', { layout: 'layouts/main', title: 'Contact Us' });
});

// Feedback form
router.get('/feedback', (req, res) => {
  res.render('public/feedback', { layout: 'layouts/main', title: 'Submit Feedback' });
});

router.post('/feedback', feedbackRules, validateRequest('/feedback'), async (req, res) => {
  try {
    const { citizenName, email, phone, subject, message, category } = req.body;
    await Feedback.create({ citizenName, email, phone, subject, message, category });
    req.flash('success', 'Thank you for your feedback! We will review it shortly.');
    res.redirect('/feedback');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error submitting feedback. Please try again.');
    res.redirect('/feedback');
  }
});

// Complaint form
router.get('/complaint', async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort('name');
  res.render('public/complaint', { layout: 'layouts/main', title: 'File a Complaint', departments });
});

router.post('/complaint', complaintRules, validateRequest('/complaint'), async (req, res) => {
  try {
    const { citizenName, email, phone, address, barangay, subject, description, category, department } = req.body;
    const trackingCode = generateTrackingCode();

    const complaintData = {
      citizenName, email, phone, address, barangay,
      subject, description, category, trackingCode
    };
    if (department) complaintData.department = department;

    await Complaint.create(complaintData);

    res.render('public/complaint-success', {
      layout: 'layouts/main',
      title: 'Complaint Submitted',
      trackingCode
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error submitting complaint. Please try again.');
    res.redirect('/complaint');
  }
});

// Track complaint
router.get('/track-complaint', (req, res) => {
  res.render('public/track-complaint', {
    layout: 'layouts/main',
    title: 'Track Your Complaint',
    complaint: null,
    searched: false
  });
});

router.post('/track-complaint', async (req, res) => {
  try {
    const { trackingCode } = req.body;
    if (!trackingCode || !trackingCode.trim()) {
      req.flash('error', 'Please enter a tracking code');
      return res.redirect('/track-complaint');
    }
    const complaint = await Complaint.findOne({ trackingCode: trackingCode.toUpperCase().trim() })
      .populate('department', 'name')
      .populate('updates.updatedBy', 'firstName lastName');

    res.render('public/track-complaint', {
      layout: 'layouts/main',
      title: 'Track Your Complaint',
      complaint,
      searched: true,
      trackingCode
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error searching. Please try again.');
    res.redirect('/track-complaint');
  }
});

// Disaster Updates
router.get('/disaster-updates', async (req, res) => {
  try {
    const updates = await DisasterUpdate.find({ isPublished: true, isActive: true }).sort({ createdAt: -1 });
    res.render('public/disaster-updates', {
      layout: 'layouts/main',
      title: 'DRRM / Disaster Updates',
      updates
    });
  } catch (err) {
    console.error(err);
    res.render('public/disaster-updates', { layout: 'layouts/main', title: 'Disaster Updates', updates: [] });
  }
});

// Events
router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const filter = { isPublished: true };
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }, { location: searchRegex }];
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('department', 'name')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter)
    ]);

    res.render('public/events', {
      layout: 'layouts/main',
      title: 'Events',
      events,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.render('public/events', {
      layout: 'layouts/main',
      title: 'Events',
      events: [],
      currentPage: 1,
      totalPages: 0,
      query: {}
    });
  }
});

// About PIO
router.get('/about', async (req, res) => {
  try {
    const siteSettings = await SiteSettings.getSettings();
    res.render('public/about', {
      layout: 'layouts/main',
      title: 'About the PIO',
      siteSettings
    });
  } catch (err) {
    console.error(err);
    res.render('public/about', { layout: 'layouts/main', title: 'About the PIO', siteSettings: {} });
  }
});

module.exports = router;
