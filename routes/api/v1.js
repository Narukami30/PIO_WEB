const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { apiAuthenticate } = require('../../middleware/apiAuth');

const authApi = require('../../controllers/api/authApiController');
const homeApi = require('../../controllers/api/homeApiController');
const announcementApi = require('../../controllers/api/announcementApiController');
const eventApi = require('../../controllers/api/eventApiController');
const departmentApi = require('../../controllers/api/departmentApiController');
const serviceApi = require('../../controllers/api/serviceApiController');
const documentApi = require('../../controllers/api/documentApiController');
const disasterApi = require('../../controllers/api/disasterApiController');
const transparencyApi = require('../../controllers/api/transparencyApiController');
const complaintApi = require('../../controllers/api/complaintApiController');
const feedbackApi = require('../../controllers/api/feedbackApiController');

// ──────────────────────────────────────────
// Rate limiting for API auth endpoints
// ──────────────────────────────────────────
const apiAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ──────────────────────────────────────────
// Auth routes (public)
// ──────────────────────────────────────────
router.post('/auth/login', apiAuthLimiter, authApi.login);
router.post('/auth/register', apiAuthLimiter, authApi.register);
router.post('/auth/refresh', authApi.refresh);
router.get('/auth/me', apiAuthenticate, authApi.getMe);

// ──────────────────────────────────────────
// Home data bundle (public)
// ──────────────────────────────────────────
router.get('/home', homeApi.home);

// ──────────────────────────────────────────
// Announcements (public)
// ──────────────────────────────────────────
router.get('/announcements', announcementApi.list);
router.get('/announcements/:slug', announcementApi.getBySlug);

// ──────────────────────────────────────────
// Events (public)
// ──────────────────────────────────────────
router.get('/events', eventApi.list);
router.get('/events/:slug', eventApi.getBySlug);

// ──────────────────────────────────────────
// Departments & Officials (public)
// ──────────────────────────────────────────
router.get('/departments', departmentApi.list);
router.get('/departments/:id', departmentApi.getById);

// ──────────────────────────────────────────
// Services / Citizen's Charter (public)
// ──────────────────────────────────────────
router.get('/services', serviceApi.list);
router.get('/services/:id', serviceApi.getById);

// ──────────────────────────────────────────
// Documents (public list, auth for detail/download)
// ──────────────────────────────────────────
router.get('/documents', documentApi.list);
router.get('/documents/:id', apiAuthenticate, documentApi.getById);

// ──────────────────────────────────────────
// Disaster Updates (public)
// ──────────────────────────────────────────
router.get('/disaster-updates', disasterApi.list);
router.get('/disaster-updates/:id', disasterApi.getById);

// ──────────────────────────────────────────
// Transparency Seal (public)
// ──────────────────────────────────────────
router.get('/transparency', transparencyApi.list);
router.get('/transparency/:id', transparencyApi.getById);

// ──────────────────────────────────────────
// Complaints (public — rate limited)
// ──────────────────────────────────────────
router.post('/complaints', apiSubmitLimiter, complaintApi.submit);
router.get('/complaints/track/:trackingCode', complaintApi.track);

// ──────────────────────────────────────────
// Feedback (public — rate limited)
// ──────────────────────────────────────────
router.post('/feedback', apiSubmitLimiter, feedbackApi.submit);

module.exports = router;
