const Document = require('../models/Document');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const validCategories = ['ordinance', 'resolution', 'executive_order', 'citizen_charter', 'forms', 'reports', 'permits', 'other'];
    const filter = {};
    if (req.query.category && validCategories.includes(req.query.category)) filter.category = req.query.category;
    if (req.query.search) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: escaped, $options: 'i' };
    }

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .populate('uploadedBy', 'firstName lastName')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Document.countDocuments(filter)
    ]);

    res.render('admin/documents/index', {
      layout: 'layouts/admin',
      title: 'Documents',
      documents,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      query: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading documents');
    res.redirect('/admin/dashboard');
  }
};

exports.create = async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort('name');
  res.render('admin/documents/form', {
    layout: 'layouts/admin',
    title: 'Upload Document',
    document: {},
    departments,
    isEdit: false
  });
};

exports.store = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error_msg', 'Please select a file to upload');
      return res.redirect('/admin/documents/create');
    }

    const { title, description, category, department, isPublished } = req.body;
    const { url } = await uploadToCloudinary(req.file.buffer, {
      folder: 'pio_naujan/documents',
      mimetype: req.file.mimetype
    });
    const document = new Document({
      title, description, category,
      department: department || undefined,
      isPublished: isPublished === 'on',
      filePath: url,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id
    });

    await document.save();
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action: 'create',
      resource: 'Document',
      resourceId: document._id,
      details: `Created document: ${document.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Document uploaded successfully');
    res.redirect('/admin/documents');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error uploading document');
    res.redirect('/admin/documents/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const [document, departments] = await Promise.all([
      Document.findById(req.params.id),
      Department.find({ isActive: true }).sort('name')
    ]);
    if (!document) {
      req.flash('error_msg', 'Document not found');
      return res.redirect('/admin/documents');
    }
    res.render('admin/documents/form', {
      layout: 'layouts/admin',
      title: 'Edit Document',
      document, departments, isEdit: true
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/documents');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description, category, department, isPublished } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      req.flash('error_msg', 'Document not found');
      return res.redirect('/admin/documents');
    }

    doc.title = title;
    doc.description = description;
    doc.category = category;
    doc.department = department || undefined;
    doc.isPublished = isPublished === 'on';

    if (req.file) {
      if (doc.filePath) await deleteFromCloudinary(doc.filePath);
      const { url } = await uploadToCloudinary(req.file.buffer, {
        folder: 'pio_naujan/documents',
        mimetype: req.file.mimetype
      });
      doc.filePath = url;
      doc.originalName = req.file.originalname;
      doc.fileSize = req.file.size;
      doc.fileType = req.file.mimetype;
    }

    await doc.save();
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action: 'update',
      resource: 'Document',
      resourceId: doc._id,
      details: `Updated document: ${doc.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Document updated');
    res.redirect('/admin/documents');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating document');
    res.redirect('/admin/documents');
  }
};

exports.delete = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (doc && doc.filePath) await deleteFromCloudinary(doc.filePath);
    await Document.findByIdAndDelete(req.params.id);
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action: 'delete',
      resource: 'Document',
      resourceId: req.params.id,
      details: doc ? `Deleted document: ${doc.title}` : 'Deleted document',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Document deleted');
    res.redirect('/admin/documents');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting document');
    res.redirect('/admin/documents');
  }
};
