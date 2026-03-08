const TransparencyReport = require('../models/TransparencyReport');
const AuditLog = require('../models/AuditLog');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const validTypes = ['transparency_seal', 'full_disclosure', 'annual_budget', 'annual_procurement', 'bid_results', 'financial_report', 'aip', 'quarterly_report', 'coa_report', 'other'];
    const filter = {};
    if (req.query.type && validTypes.includes(req.query.type)) filter.reportType = req.query.type;
    if (req.query.year) filter.fiscalYear = parseInt(req.query.year);

    const [reports, total] = await Promise.all([
      TransparencyReport.find(filter)
        .populate('uploadedBy', 'firstName lastName')
        .sort({ fiscalYear: -1, createdAt: -1 })
        .skip(skip).limit(limit),
      TransparencyReport.countDocuments(filter)
    ]);

    res.render('admin/transparency/index', {
      layout: 'layouts/admin',
      title: 'Transparency Reports',
      reports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      query: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading reports');
    res.redirect('/admin/dashboard');
  }
};

exports.create = (req, res) => {
  res.render('admin/transparency/form', {
    layout: 'layouts/admin',
    title: 'Upload Report',
    report: {},
    isEdit: false
  });
};

exports.store = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error_msg', 'Please select a file');
      return res.redirect('/admin/transparency/create');
    }
    const { title, reportType, fiscalYear, quarter, description, isPublished } = req.body;
    const { url } = await uploadToCloudinary(req.file.buffer, {
      folder: 'pio_naujan/reports',
      mimetype: req.file.mimetype
    });
    const report = new TransparencyReport({
      title, reportType, fiscalYear: parseInt(fiscalYear),
      quarter: quarter || '', description,
      isPublished: isPublished === 'on',
      filePath: url,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    });
    await report.save();
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action: 'create',
      resource: 'TransparencyReport',
      resourceId: report._id,
      details: `Created transparency report: ${report.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Report uploaded');
    res.redirect('/admin/transparency');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error uploading report');
    res.redirect('/admin/transparency/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const report = await TransparencyReport.findById(req.params.id);
    if (!report) {
      req.flash('error_msg', 'Report not found');
      return res.redirect('/admin/transparency');
    }
    res.render('admin/transparency/form', {
      layout: 'layouts/admin',
      title: 'Edit Report',
      report, isEdit: true
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/transparency');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, reportType, fiscalYear, quarter, description, isPublished } = req.body;
    const report = await TransparencyReport.findById(req.params.id);
    if (!report) {
      req.flash('error_msg', 'Report not found');
      return res.redirect('/admin/transparency');
    }

    Object.assign(report, {
      title, reportType, fiscalYear: parseInt(fiscalYear),
      quarter: quarter || '', description,
      isPublished: isPublished === 'on'
    });
    if (req.file) {
      if (report.filePath) await deleteFromCloudinary(report.filePath);
      const { url } = await uploadToCloudinary(req.file.buffer, {
        folder: 'pio_naujan/reports',
        mimetype: req.file.mimetype
      });
      report.filePath = url;
      report.originalName = req.file.originalname;
      report.fileSize = req.file.size;
    }
    await report.save();
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action: 'update',
      resource: 'TransparencyReport',
      resourceId: report._id,
      details: `Updated transparency report: ${report.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Report updated');
    res.redirect('/admin/transparency');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating report');
    res.redirect('/admin/transparency');
  }
};

exports.delete = async (req, res) => {
  try {
    const report = await TransparencyReport.findById(req.params.id);
    if (report && report.filePath) await deleteFromCloudinary(report.filePath);
    await TransparencyReport.findByIdAndDelete(req.params.id);
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action: 'delete',
      resource: 'TransparencyReport',
      resourceId: req.params.id,
      details: report ? `Deleted transparency report: ${report.title}` : 'Deleted transparency report',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Report deleted');
    res.redirect('/admin/transparency');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting report');
    res.redirect('/admin/transparency');
  }
};
