const Complaint = require('../../models/Complaint');
const Department = require('../../models/Department');
const { generateTrackingCode } = require('../../utils/helpers');

/**
 * POST /api/v1/complaints
 * Submit a new complaint (public — no auth required)
 */
exports.submit = async (req, res) => {
  try {
    const { citizenName, email, phone, address, barangay, subject, description, category, department } = req.body;

    if (!citizenName || !subject || !description) {
      return res.status(400).json({ success: false, message: 'Name, subject, and description are required' });
    }

    if (citizenName.length < 2 || citizenName.length > 100) {
      return res.status(400).json({ success: false, message: 'Name must be 2-100 characters' });
    }
    if (subject.length < 3 || subject.length > 200) {
      return res.status(400).json({ success: false, message: 'Subject must be 3-200 characters' });
    }
    if (description.length < 10 || description.length > 5000) {
      return res.status(400).json({ success: false, message: 'Description must be 10-5000 characters' });
    }

    const trackingCode = generateTrackingCode();

    const complaintData = {
      citizenName, email, phone, address, barangay,
      subject, description, category, trackingCode
    };

    if (department) {
      const dept = await Department.findById(department);
      if (dept && dept.isActive) {
        complaintData.department = department;
      }
    }

    const complaint = await Complaint.create(complaintData);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        trackingCode: complaint.trackingCode,
        status: complaint.status,
        createdAt: complaint.createdAt
      }
    });
  } catch (err) {
    console.error('API complaint submit error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit complaint' });
  }
};

/**
 * GET /api/v1/complaints/track/:trackingCode
 * Track a complaint by tracking code (public — no auth required)
 */
exports.track = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ trackingCode: req.params.trackingCode })
      .populate('department', 'name')
      .populate('assignedTo', 'firstName lastName')
      .select('trackingCode subject status priority category department assignedTo updates createdAt resolvedAt');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found. Please check your tracking code.' });
    }

    res.json({ success: true, data: complaint });
  } catch (err) {
    console.error('API complaint track error:', err);
    res.status(500).json({ success: false, message: 'Failed to track complaint' });
  }
};
