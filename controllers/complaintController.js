const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const { generateTrackingCode } = require('../utils/helpers');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const filter = {};
    const validStatuses = ['submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (req.query.status && validStatuses.includes(req.query.status)) filter.status = req.query.status;
    if (req.query.priority && validPriorities.includes(req.query.priority)) filter.priority = req.query.priority;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('department', 'name')
        .populate('assignedTo', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Complaint.countDocuments(filter)
    ]);

    res.render('admin/complaints/index', {
      layout: 'layouts/admin',
      title: 'Complaints',
      complaints,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      query: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading complaints');
    res.redirect('/admin/dashboard');
  }
};

exports.view = async (req, res) => {
  try {
    const [complaint, departments] = await Promise.all([
      Complaint.findById(req.params.id)
        .populate('department', 'name')
        .populate('assignedTo', 'firstName lastName')
        .populate('updates.updatedBy', 'firstName lastName'),
      Department.find({ isActive: true }).sort('name')
    ]);

    if (!complaint) {
      req.flash('error_msg', 'Complaint not found');
      return res.redirect('/admin/complaints');
    }

    res.render('admin/complaints/view', {
      layout: 'layouts/admin',
      title: 'View Complaint',
      complaint, departments
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/complaints');
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      req.flash('error_msg', 'Complaint not found');
      return res.redirect('/admin/complaints');
    }

    const { status, message, priority, assignedTo, department } = req.body;

    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (department) complaint.department = department;

    if (status === 'resolved') complaint.resolvedAt = new Date();

    complaint.updates.push({
      status: status || complaint.status,
      message: message || `Status updated to ${status}`,
      updatedBy: req.user._id
    });

    await complaint.save();
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'update',
      resource: 'Complaint',
      resourceId: complaint._id,
      details: `Updated complaint: ${complaint.subject}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Complaint updated');
    res.redirect(`/admin/complaints/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating complaint');
    res.redirect('/admin/complaints');
  }
};

exports.report = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('department')
      .populate('assignedTo', 'firstName lastName')
      .populate('updates.updatedBy', 'firstName lastName');

    if (!complaint) {
      req.flash('error_msg', 'Complaint not found');
      return res.redirect('/admin/complaints');
    }

    const { formatDate } = require('../utils/helpers');
    res.render('admin/complaints/report', {
      layout: false,
      complaint,
      formatDate
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error generating report');
    res.redirect(`/admin/complaints/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    await Complaint.findByIdAndDelete(req.params.id);
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'delete',
      resource: 'Complaint',
      resourceId: req.params.id,
      details: complaint ? `Deleted complaint: ${complaint.subject}` : 'Deleted complaint',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Complaint deleted');
    res.redirect('/admin/complaints');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting');
    res.redirect('/admin/complaints');
  }
};
