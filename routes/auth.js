const router = require('express').Router();
const authController = require('../controllers/authController');
const { ensureGuest } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validateRequest = (redirectPath) => (req, res, next) => {
	const errors = validationResult(req);
	if (errors.isEmpty()) {
		return next();
	}
	req.flash('error_msg', errors.array()[0].msg);
	return res.redirect(redirectPath);
};

router.get('/login', ensureGuest, authController.getLogin);
router.post(
	'/login',
	[
		body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
		body('password').notEmpty().withMessage('Please enter password')
	],
	validateRequest('/auth/login'),
	authController.postLogin
);
router.get('/register', ensureGuest, authController.getRegister);
router.post(
	'/register',
	[
		body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
		body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
		body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
		body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters'),
		body('password2').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
	],
	validateRequest('/auth/register'),
	authController.postRegister
);
router.get('/verify-otp', authController.getVerifyOtp);
router.post(
	'/verify-otp',
	[
		body('otp').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Please enter a valid 6-digit code')
	],
	validateRequest('/auth/verify-otp'),
	authController.postVerifyOtp
);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// Password reset
router.get('/forgot-password', ensureGuest, authController.getForgotPassword);
router.post(
	'/forgot-password',
	[
		body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail()
	],
	validateRequest('/auth/forgot-password'),
	authController.postForgotPassword
);
router.get('/reset-password/:token', authController.getResetPassword);
router.post(
	'/reset-password/:token',
	[
		body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters'),
		body('password2').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
	],
	validateRequest('/auth/forgot-password'),
	authController.postResetPassword
);

module.exports = router;
