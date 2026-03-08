const router = require('express').Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const Document = require('../models/Document');
const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Service = require('../models/Service');
const Department = require('../models/Department');
const DisasterUpdate = require('../models/DisasterUpdate');
const { formatDate, statusBadgeClass, alertLevelClass, truncate, formatFileSize } = require('../utils/helpers');

// Make helpers available in admin views
router.use((req, res, next) => {
  res.locals.formatDate = formatDate;
  res.locals.statusBadgeClass = statusBadgeClass;
  res.locals.alertLevelClass = alertLevelClass;
  res.locals.truncate = truncate;
  res.locals.formatFileSize = formatFileSize;
  next();
});

router.use(ensureAuthenticated);

// Dashboard — require at least one admin-level permission
router.get('/dashboard', authorize('view_dashboard', 'manage_all_content', 'manage_announcements', 'manage_events', 'manage_documents', 'manage_services', 'manage_complaints', 'manage_feedback', 'manage_users'), async (req, res) => {
  try {
    const [
      announcements, events, documents,
      newFeedback, pendingComplaints, users,
      services, departments, activeAlerts,
      recentFeedback, recentComplaints, recentLogs
    ] = await Promise.all([
      Announcement.countDocuments({}),
      Event.countDocuments({}),
      Document.countDocuments({}),
      Feedback.countDocuments({ status: 'new' }),
      Complaint.countDocuments({ status: { $in: ['submitted', 'under_review', 'in_progress'] } }),
      User.countDocuments({}),
      Service.countDocuments({}),
      Department.countDocuments({}),
      DisasterUpdate.countDocuments({ isActive: true, isPublished: true }),
      Feedback.find({}).sort({ createdAt: -1 }).limit(5),
      Complaint.find({}).sort({ createdAt: -1 }).limit(5),
      AuditLog.find({}).populate('user', 'firstName lastName').sort({ createdAt: -1 }).limit(10)
    ]);

    res.render('admin/dashboard', {
      layout: 'layouts/admin',
      title: 'Dashboard',
      stats: { announcements, events, documents, newFeedback, pendingComplaints, users, services, departments, activeAlerts },
      recentFeedback, recentComplaints, recentLogs
    });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', {
      layout: 'layouts/admin',
      title: 'Dashboard',
      stats: { announcements: 0, events: 0, documents: 0, newFeedback: 0, pendingComplaints: 0, users: 0, services: 0, departments: 0, activeAlerts: 0 },
      recentFeedback: [], recentComplaints: [], recentLogs: []
    });
  }
});

// Audit Logs
router.get('/audit-logs', authorize('view_audit_logs'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({}).populate('user', 'firstName lastName email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments({})
    ]);

    res.render('admin/audit-logs', {
      layout: 'layouts/admin',
      title: 'Audit Logs',
      logs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      query: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading audit logs');
    res.redirect('/admin/dashboard');
  }
});

// Delete single audit log (super_admin only)
router.post('/audit-logs/:id/delete', authorize('super_admin'), async (req, res) => {
  try {
    await AuditLog.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Log entry deleted.');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to delete log entry.');
  }
  res.redirect('/admin/audit-logs');
});

// Clear all audit logs (super_admin only)
router.post('/audit-logs/clear-all', authorize('super_admin'), async (req, res) => {
  try {
    await AuditLog.deleteMany({});
    req.flash('success_msg', 'All audit logs cleared.');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to clear audit logs.');
  }
  res.redirect('/admin/audit-logs');
});

module.exports = router;
