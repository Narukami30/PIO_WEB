const Feedback = require('../../models/Feedback');

/**
 * POST /api/v1/feedback
 * Submit feedback (public — no auth required)
 */
exports.submit = async (req, res) => {
  try {
    const { citizenName, email, phone, subject, message, category } = req.body;

    if (!citizenName || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, subject, and message are required' });
    }

    if (citizenName.length < 2 || citizenName.length > 100) {
      return res.status(400).json({ success: false, message: 'Name must be 2-100 characters' });
    }
    if (subject.length < 3 || subject.length > 200) {
      return res.status(400).json({ success: false, message: 'Subject must be 3-200 characters' });
    }
    if (message.length < 10 || message.length > 5000) {
      return res.status(400).json({ success: false, message: 'Message must be 10-5000 characters' });
    }

    await Feedback.create({ citizenName, email, phone, subject, message, category });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! We will review it shortly.'
    });
  } catch (err) {
    console.error('API feedback submit error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
};
