const Announcement = require('../models/Announcement');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const sanitizeHtml = require('sanitize-html');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'figure', 'figcaption', 'iframe']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'style'],
    a: ['href', 'name', 'target', 'rel'],
    '*': ['class', 'style']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedIframeHostnames: ['www.youtube.com', 'www.google.com']
};

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const validCategories = ['general', 'notice', 'advisory', 'ordinance', 'resolution', 'executive_order', 'procurement', 'jobs', 'other'];
    const filter = {};

    if (req.query.category && validCategories.includes(req.query.category)) filter.category = req.query.category;
    if (req.query.status === 'published') filter.isPublished = true;
    else if (req.query.status === 'draft') filter.isPublished = false;
    if (req.query.search) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: escaped, $options: 'i' };
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'firstName lastName')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Announcement.countDocuments(filter)
    ]);

    res.render('admin/announcements/index', {
      layout: 'layouts/admin',
      title: 'Announcements',
      announcements,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      query: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading announcements');
    res.redirect('/admin/dashboard');
  }
};

exports.create = async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort('name');
  res.render('admin/announcements/form', {
    layout: 'layouts/admin',
    title: 'New Announcement',
    announcement: {},
    departments,
    isEdit: false
  });
};

exports.store = async (req, res) => {
  try {
    const { title, content, excerpt, category, department, isPublished, isPinned } = req.body;

    let imageUrl = '';
    if (req.file) {
      const { url } = await uploadToCloudinary(req.file.buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.file.mimetype
      });
      imageUrl = url;
    }

    const announcement = new Announcement({
      title,
      content: sanitizeHtml(content, sanitizeOptions),
      excerpt,
      category,
      department: department || undefined,
      isPublished: isPublished === 'on',
      isPinned: isPinned === 'on',
      image: imageUrl,
      createdBy: req.user._id,
      publishedBy: isPublished === 'on' ? req.user._id : undefined
    });

    await announcement.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'create',
      resource: 'Announcement',
      resourceId: announcement._id,
      details: `Created announcement: ${title}`,
      ipAddress: req.ip
    });

    req.flash('success_msg', 'Announcement created successfully');
    res.redirect('/admin/announcements');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating announcement');
    res.redirect('/admin/announcements/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const [announcement, departments] = await Promise.all([
      Announcement.findById(req.params.id),
      Department.find({ isActive: true }).sort('name')
    ]);

    if (!announcement) {
      req.flash('error_msg', 'Announcement not found');
      return res.redirect('/admin/announcements');
    }

    res.render('admin/announcements/form', {
      layout: 'layouts/admin',
      title: 'Edit Announcement',
      announcement,
      departments,
      isEdit: true
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading announcement');
    res.redirect('/admin/announcements');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, content, excerpt, category, department, isPublished, isPinned } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      req.flash('error_msg', 'Announcement not found');
      return res.redirect('/admin/announcements');
    }

    announcement.title = title;
    announcement.content = sanitizeHtml(content, sanitizeOptions);
    announcement.excerpt = excerpt;
    announcement.category = category;
    announcement.department = department || undefined;
    announcement.isPublished = isPublished === 'on';
    announcement.isPinned = isPinned === 'on';

    if (req.file) {
      if (announcement.image) await deleteFromCloudinary(announcement.image);
      const { url } = await uploadToCloudinary(req.file.buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.file.mimetype
      });
      announcement.image = url;
    }

    if (isPublished === 'on' && !announcement.publishedBy) {
      announcement.publishedBy = req.user._id;
    }

    await announcement.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'update',
      resource: 'Announcement',
      resourceId: announcement._id,
      details: `Updated announcement: ${title}`,
      ipAddress: req.ip
    });

    req.flash('success_msg', 'Announcement updated successfully');
    res.redirect('/admin/announcements');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating announcement');
    res.redirect(`/admin/announcements/${req.params.id}/edit`);
  }
};

exports.delete = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      req.flash('error_msg', 'Announcement not found');
      return res.redirect('/admin/announcements');
    }
    // Delete image from Cloudinary if exists
    if (announcement.image) await deleteFromCloudinary(announcement.image);
    await Announcement.findByIdAndDelete(req.params.id);
    await AuditLog.create({
      user: req.user._id,
      action: 'delete',
      resource: 'Announcement',
      resourceId: req.params.id,
      details: `Deleted announcement: ${announcement.title}`,
      ipAddress: req.ip
    });
    req.flash('success_msg', 'Announcement deleted');
    res.redirect('/admin/announcements');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting announcement');
    res.redirect('/admin/announcements');
  }
};
