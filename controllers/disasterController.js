const DisasterUpdate = require('../models/DisasterUpdate');

exports.index = async (req, res) => {
  try {
    const updates = await DisasterUpdate.find({})
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.render('admin/disaster/index', {
      layout: 'layouts/admin',
      title: 'Disaster/DRRM Updates',
      updates,
      currentPage: 1,
      totalPages: 0
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading updates');
    res.redirect('/admin/dashboard');
  }
};

exports.create = (req, res) => {
  res.render('admin/disaster/form', {
    layout: 'layouts/admin',
    title: 'New Disaster Update',
    update: {},
    isEdit: false
  });
};

exports.store = async (req, res) => {
  try {
    const { title, content, alertLevel, type, affectedBarangays, isActive, isPublished } = req.body;
    const update = new DisasterUpdate({
      title, content, alertLevel, type,
      affectedBarangays: affectedBarangays ? affectedBarangays.split(',').map(b => b.trim()).filter(Boolean) : [],
      isActive: isActive === 'on',
      isPublished: isPublished === 'on',
      createdBy: req.user._id
    });
    await update.save();
    req.flash('success_msg', 'Disaster update created');
    res.redirect('/admin/disaster');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating update');
    res.redirect('/admin/disaster/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const update = await DisasterUpdate.findById(req.params.id);
    if (!update) {
      req.flash('error_msg', 'Update not found');
      return res.redirect('/admin/disaster');
    }
    res.render('admin/disaster/form', {
      layout: 'layouts/admin',
      title: 'Edit Disaster Update',
      update, isEdit: true
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/disaster');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, content, alertLevel, type, affectedBarangays, isActive, isPublished } = req.body;
    const update = await DisasterUpdate.findById(req.params.id);
    if (!update) {
      req.flash('error_msg', 'Update not found');
      return res.redirect('/admin/disaster');
    }

    Object.assign(update, {
      title, content, alertLevel, type,
      affectedBarangays: affectedBarangays ? affectedBarangays.split(',').map(b => b.trim()).filter(Boolean) : [],
      isActive: isActive === 'on',
      isPublished: isPublished === 'on'
    });

    await update.save();
    req.flash('success_msg', 'Update saved');
    res.redirect('/admin/disaster');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating');
    res.redirect('/admin/disaster');
  }
};

exports.togglePublish = async (req, res) => {
  try {
    const update = await DisasterUpdate.findById(req.params.id);
    if (!update) {
      req.flash('error_msg', 'Update not found');
      return res.redirect('/admin/disaster');
    }
    update.isPublished = !update.isPublished;
    await update.save();
    req.flash('success_msg', update.isPublished ? 'Alert published' : 'Alert unpublished');
    res.redirect('/admin/disaster');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error toggling publish status');
    res.redirect('/admin/disaster');
  }
};

exports.delete = async (req, res) => {
  try {
    await DisasterUpdate.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Update deleted');
    res.redirect('/admin/disaster');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting');
    res.redirect('/admin/disaster');
  }
};
