const Feedback = require('../models/Feedback');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const validStatuses = ['new', 'read', 'responded', 'archived'];
    const filter = {};
    if (req.query.status && validStatuses.includes(req.query.status)) filter.status = req.query.status;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter)
        .populate('respondedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Feedback.countDocuments(filter)
    ]);

    res.render('admin/feedback/index', {
      layout: 'layouts/admin',
      title: 'Citizen Feedback',
      feedbacks,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      query: req.query
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading feedback');
    res.redirect('/admin/dashboard');
  }
};

exports.view = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('respondedBy', 'firstName lastName');
    if (!feedback) {
      req.flash('error_msg', 'Feedback not found');
      return res.redirect('/admin/feedback');
    }
    if (feedback.status === 'new') {
      feedback.status = 'read';
      await feedback.save();
    }
    res.render('admin/feedback/view', {
      layout: 'layouts/admin',
      title: 'View Feedback',
      feedback
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/feedback');
  }
};

exports.respond = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      req.flash('error_msg', 'Feedback not found');
      return res.redirect('/admin/feedback');
    }

    feedback.adminResponse = req.body.adminResponse;
    feedback.status = 'responded';
    feedback.respondedBy = req.user._id;
    feedback.respondedAt = new Date();
    await feedback.save();

    req.flash('success_msg', 'Response saved');
    res.redirect('/admin/feedback');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error responding');
    res.redirect('/admin/feedback');
  }
};

exports.archive = async (req, res) => {
  try {
    await Feedback.findByIdAndUpdate(req.params.id, { status: 'archived' });
    req.flash('success_msg', 'Feedback archived');
    res.redirect('/admin/feedback');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error archiving');
    res.redirect('/admin/feedback');
  }
};

exports.delete = async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Feedback deleted');
    res.redirect('/admin/feedback');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting');
    res.redirect('/admin/feedback');
  }
};
