const Service = require('../models/Service');
const Department = require('../models/Department');

exports.index = async (req, res) => {
  try {
    const services = await Service.find({})
      .populate('department', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ order: 1, createdAt: -1 });

    res.render('admin/services/index', {
      layout: 'layouts/admin',
      title: 'Services',
      services,
      currentPage: 1,
      totalPages: 0
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading services');
    res.redirect('/admin/dashboard');
  }
};

exports.create = async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort('name');
  res.render('admin/services/form', {
    layout: 'layouts/admin',
    title: 'New Service',
    service: {},
    departments,
    isEdit: false
  });
};

exports.store = async (req, res) => {
  try {
    const { name, description, department, requirements, fees, processingTime, isActive, order } = req.body;

    const service = new Service({
      name, description,
      department: department || undefined,
      requirements: requirements ? requirements.split('\n').map(r => r.trim()).filter(Boolean) : [],
      fees, processingTime,
      isActive: isActive === 'on',
      order: parseInt(order, 10) || 0,
      createdBy: req.user._id
    });

    // Parse steps
    service.steps = req.body.steps
      ? req.body.steps.split('\n').map((desc, i) => ({
        stepNumber: i + 1,
        description: desc.trim()
      })).filter(s => s.description)
      : [];

    await service.save();
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'create',
      resource: 'Service',
      resourceId: service._id,
      details: `Created service: ${service.name}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Service created');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating service');
    res.redirect('/admin/services/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const [service, departments] = await Promise.all([
      Service.findById(req.params.id),
      Department.find({ isActive: true }).sort('name')
    ]);
    if (!service) {
      req.flash('error_msg', 'Service not found');
      return res.redirect('/admin/services');
    }
    res.render('admin/services/form', {
      layout: 'layouts/admin',
      title: 'Edit Service',
      service, departments, isEdit: true
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/services');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, department, requirements, fees, processingTime, isActive, order } = req.body;
    const service = await Service.findById(req.params.id);
    if (!service) {
      req.flash('error_msg', 'Service not found');
      return res.redirect('/admin/services');
    }

    Object.assign(service, {
      name, description,
      department: department || undefined,
      requirements: requirements ? requirements.split('\n').map(r => r.trim()).filter(Boolean) : [],
      fees, processingTime,
      isActive: isActive === 'on',
      order: parseInt(order, 10) || 0
    });

    service.steps = req.body.steps
      ? req.body.steps.split('\n').map((desc, i) => ({
        stepNumber: i + 1,
        description: desc.trim()
      })).filter(s => s.description)
      : [];

    await service.save();
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'update',
      resource: 'Service',
      resourceId: service._id,
      details: `Updated service: ${service.name}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Service updated');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating service');
    res.redirect('/admin/services');
  }
};

exports.delete = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    await Service.findByIdAndDelete(req.params.id);
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'delete',
      resource: 'Service',
      resourceId: req.params.id,
      details: service ? `Deleted service: ${service.name}` : 'Deleted service',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'Service deleted');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting service');
    res.redirect('/admin/services');
  }
};
