const Event = require('../models/Event');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find({})
        .populate('createdBy', 'firstName lastName')
        .populate('department', 'name')
        .sort({ startDate: -1 })
        .skip(skip).limit(limit),
      Event.countDocuments({})
    ]);

    res.render('admin/events/index', {
      layout: 'layouts/admin',
      title: 'Events',
      events,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      query: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading events');
    res.redirect('/admin/dashboard');
  }
};

exports.create = async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort('name');
  res.render('admin/events/form', {
    layout: 'layouts/admin',
    title: 'New Event',
    event: {},
    departments,
    isEdit: false
  });
};

exports.store = async (req, res) => {
  try {
    const { title, description, location, startDate, endDate, category, department, isPublished, isFeatured } = req.body;

    let imageUrl = '';
    if (req.file) {
      const { url } = await uploadToCloudinary(req.file.buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.file.mimetype
      });
      imageUrl = url;
    }

    const event = new Event({
      title, description, location, startDate, endDate, category,
      department: department || undefined,
      isPublished: isPublished === 'on',
      isFeatured: isFeatured === 'on',
      image: imageUrl,
      createdBy: req.user._id
    });

    await event.save();
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action: 'create',
      resource: 'Event',
      resourceId: event._id,
      details: `Created event: ${event.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Event created successfully');
    res.redirect('/admin/events');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating event');
    res.redirect('/admin/events/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const [event, departments] = await Promise.all([
      Event.findById(req.params.id),
      Department.find({ isActive: true }).sort('name')
    ]);
    if (!event) {
      req.flash('error_msg', 'Event not found');
      return res.redirect('/admin/events');
    }
    res.render('admin/events/form', {
      layout: 'layouts/admin',
      title: 'Edit Event',
      event,
      departments,
      isEdit: true
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/events');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description, location, startDate, endDate, category, department, isPublished, isFeatured } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      req.flash('error_msg', 'Event not found');
      return res.redirect('/admin/events');
    }

    Object.assign(event, {
      title, description, location, startDate, endDate, category,
      department: department || undefined,
      isPublished: isPublished === 'on',
      isFeatured: isFeatured === 'on'
    });
    if (req.file) {
      if (event.image) await deleteFromCloudinary(event.image);
      const { url } = await uploadToCloudinary(req.file.buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.file.mimetype
      });
      event.image = url;
    }

    await event.save();
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action: 'update',
      resource: 'Event',
      resourceId: event._id,
      details: `Updated event: ${event.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Event updated');
    res.redirect('/admin/events');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating event');
    res.redirect('/admin/events');
  }
};

exports.delete = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (event && event.image) await deleteFromCloudinary(event.image);
    await Event.findByIdAndDelete(req.params.id);
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action: 'delete',
      resource: 'Event',
      resourceId: req.params.id,
      details: event ? `Deleted event: ${event.title}` : 'Deleted event',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Event deleted');
    res.redirect('/admin/events');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting event');
    res.redirect('/admin/events');
  }
};
