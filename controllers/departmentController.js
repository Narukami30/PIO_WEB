const Department = require('../models/Department');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      Department.find({})
        .sort({ order: 1, name: 1 })
        .skip(skip).limit(limit),
      Department.countDocuments({})
    ]);

    res.render('admin/departments/index', {
      layout: 'layouts/admin',
      title: 'Departments',
      departments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading departments');
    res.redirect('/admin/dashboard');
  }
};

exports.create = (req, res) => {
  res.render('admin/departments/form', {
    layout: 'layouts/admin',
    title: 'New Department',
    department: {},
    isEdit: false
  });
};

exports.store = async (req, res) => {
  try {
    const { name, code, description, head, headTitle, email, phone, location, isActive, order } = req.body;
    let imageUrl = '';
    if (req.file) {
      const { url } = await uploadToCloudinary(req.file.buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.file.mimetype
      });
      imageUrl = url;
    }
    const department = new Department({
      name, code: code.toUpperCase(), description, head, headTitle,
      email, phone, location,
      isActive: isActive === 'on',
      order: parseInt(order) || 0,
      image: imageUrl
    });
    await department.save();
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'create',
      resource: 'Department',
      resourceId: department._id,
      details: `Created department: ${department.name}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Department created');
    res.redirect('/admin/departments');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating department');
    res.redirect('/admin/departments/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      req.flash('error_msg', 'Department not found');
      return res.redirect('/admin/departments');
    }
    res.render('admin/departments/form', {
      layout: 'layouts/admin',
      title: 'Edit Department',
      department, isEdit: true
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/departments');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, code, description, head, headTitle, email, phone, location, isActive, order } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) {
      req.flash('error_msg', 'Department not found');
      return res.redirect('/admin/departments');
    }

    Object.assign(department, {
      name, code: code.toUpperCase(), description, head, headTitle,
      email, phone, location,
      isActive: isActive === 'on',
      order: parseInt(order) || 0
    });
    if (req.file) {
      if (department.image) await deleteFromCloudinary(department.image);
      const { url } = await uploadToCloudinary(req.file.buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.file.mimetype
      });
      department.image = url;
    }

    await department.save();
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'update',
      resource: 'Department',
      resourceId: department._id,
      details: `Updated department: ${department.name}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Department updated');
    res.redirect('/admin/departments');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating department');
    res.redirect('/admin/departments');
  }
};

// Cascading cleanup: delete or update all resources referencing this department
exports.delete = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const department = await Department.findById(departmentId);
    if (department && department.image) await deleteFromCloudinary(department.image);

    // 1. Announcements
    const Announcement = require('../models/Announcement');
    const announcements = await Announcement.find({ department: departmentId });
    for (const ann of announcements) {
      if (ann.image) await deleteFromCloudinary(ann.image);
      await Announcement.findByIdAndDelete(ann._id);
    }

    // 2. Events
    const Event = require('../models/Event');
    const events = await Event.find({ department: departmentId });
    for (const event of events) {
      if (event.image) await deleteFromCloudinary(event.image);
      await Event.findByIdAndDelete(event._id);
    }

    // 3. Documents
    const Document = require('../models/Document');
    const documents = await Document.find({ department: departmentId });
    for (const doc of documents) {
      if (doc.filePath) await deleteFromCloudinary(doc.filePath);
      await Document.findByIdAndDelete(doc._id);
    }

    // 4. Services
    const Service = require('../models/Service');
    await Service.deleteMany({ department: departmentId });

    // 5. Complaints
    const Complaint = require('../models/Complaint');
    await Complaint.deleteMany({ department: departmentId });

    // 6. Users: unset department field
    const User = require('../models/User');
    await User.updateMany({ department: departmentId }, { $unset: { department: "" } });

    // Finally, delete the department
    await Department.findByIdAndDelete(departmentId);
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'delete',
      resource: 'Department',
      resourceId: departmentId,
      details: department ? `Deleted department: ${department.name}` : 'Deleted department',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Department and all related resources deleted/updated');
    res.redirect('/admin/departments');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting department and related resources');
    res.redirect('/admin/departments');
  }
};
