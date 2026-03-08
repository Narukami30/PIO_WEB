const { body, validationResult } = require('express-validator');

const ANNOUNCEMENT_CATEGORIES = ['general', 'notice', 'advisory', 'ordinance', 'resolution', 'executive_order', 'procurement', 'jobs', 'other'];
const EVENT_CATEGORIES = ['fiesta', 'meeting', 'seminar', 'sports', 'health', 'outreach', 'ceremony', 'other'];
const DOCUMENT_CATEGORIES = ['ordinance', 'resolution', 'executive_order', 'citizen_charter', 'forms', 'reports', 'permits', 'other'];
const DISASTER_ALERT_LEVELS = ['info', 'advisory', 'warning', 'critical'];
const DISASTER_TYPES = ['typhoon', 'flood', 'earthquake', 'fire', 'landslide', 'volcanic', 'pandemic', 'general'];
const FEEDBACK_CATEGORIES = ['suggestion', 'compliment', 'inquiry', 'other'];
const COMPLAINT_CATEGORIES = ['infrastructure', 'public_service', 'health', 'peace_and_order', 'environment', 'corruption', 'other'];

const validateRequest = (redirectTo = 'back') => (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  req.flash('error', errors.array()[0].msg);
  if (redirectTo === 'back') {
    return res.redirect(req.get('Referrer') || '/admin/dashboard');
  }

  return res.redirect(redirectTo);
};

const announcementRules = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Announcement title must be 3-200 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Announcement content is too short'),
  body('category').isIn(ANNOUNCEMENT_CATEGORIES).withMessage('Invalid announcement category'),
  body('excerpt').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Excerpt must not exceed 500 characters')
];

const eventRules = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Event title must be 3-200 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Event description is too short'),
  body('category').isIn(EVENT_CATEGORIES).withMessage('Invalid event category'),
  body('startDate').isISO8601().withMessage('Invalid event start date'),
  body('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid event end date'),
  body('location').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Location must not exceed 200 characters')
];

const documentRules = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Document title must be 3-200 characters'),
  body('category').isIn(DOCUMENT_CATEGORIES).withMessage('Invalid document category'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters')
];

const serviceRules = [
  body('name').trim().isLength({ min: 3, max: 200 }).withMessage('Service name must be 3-200 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Service description is too short'),
  body('requirements').optional({ checkFalsy: true }).isString().withMessage('Invalid requirements format'),
  body('steps').optional({ checkFalsy: true }).isString().withMessage('Invalid steps format'),
  body('order').optional({ checkFalsy: true }).isInt({ min: 0, max: 9999 }).withMessage('Order must be a number between 0 and 9999')
];

const disasterRules = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Alert title must be 3-200 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Alert content is too short'),
  body('alertLevel').isIn(DISASTER_ALERT_LEVELS).withMessage('Invalid alert level'),
  body('type').isIn(DISASTER_TYPES).withMessage('Invalid disaster type'),
  body('affectedBarangays').optional({ checkFalsy: true }).isString().withMessage('Invalid affected barangays format')
];

const feedbackRules = [
  body('citizenName').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('subject').trim().isLength({ min: 3, max: 200 }).withMessage('Subject must be 3-200 characters'),
  body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be 10-5000 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone number too long'),
  body('category').optional({ checkFalsy: true }).isIn(FEEDBACK_CATEGORIES).withMessage('Invalid feedback category')
];

const complaintRules = [
  body('citizenName').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('subject').trim().isLength({ min: 3, max: 200 }).withMessage('Subject must be 3-200 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone number too long'),
  body('address').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Address too long'),
  body('barangay').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Barangay name too long'),
  body('category').optional({ checkFalsy: true }).isIn(COMPLAINT_CATEGORIES).withMessage('Invalid complaint category')
];

module.exports = {
  validateRequest,
  announcementRules,
  eventRules,
  documentRules,
  serviceRules,
  disasterRules,
  feedbackRules,
  complaintRules
};
