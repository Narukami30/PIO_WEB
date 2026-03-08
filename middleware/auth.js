// JWT Authentication middleware
const User = require('../models/User');
const { verifyToken, clearTokenCookies, JWT_COOKIE_NAME } = require('../utils/jwt');

/**
 * Ensure the request has a valid JWT token.
 * Populates req.user with the full user document (role + department populated).
 * Also sets res.locals.user for EJS templates.
 */
const ensureAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies ? req.cookies[JWT_COOKIE_NAME] : null;

    if (!token) {
      req.flash('error_msg', 'Please log in to access this page');
      return res.redirect('/auth/login');
    }

    // Verify and decode JWT
    const decoded = verifyToken(token);
    if (!decoded) {
      clearTokenCookies(res);
      req.flash('error_msg', 'Session expired. Please log in again.');
      return res.redirect('/auth/login');
    }

    // Fetch fresh user from DB with role & department
    const user = await User.findById(decoded.id)
      .populate('role')
      .populate('department')
      .select('-password');

    if (!user) {
      clearTokenCookies(res);
      req.flash('error_msg', 'User account not found');
      return res.redirect('/auth/login');
    }

    if (!user.isActive) {
      clearTokenCookies(res);
      req.flash('error_msg', 'Account is deactivated');
      return res.redirect('/auth/login');
    }

    // Attach user to request and response locals
    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    console.error('JWT Auth error:', err);
    clearTokenCookies(res);
    req.flash('error_msg', 'Authentication error. Please log in again.');
    res.redirect('/auth/login');
  }
};

/**
 * Ensure the user is NOT authenticated (guest only).
 * Used for login/register pages — redirect to dashboard if already logged in.
 */
const ensureGuest = (req, res, next) => {
  const token = req.cookies ? req.cookies[JWT_COOKIE_NAME] : null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const isAdmin = decoded.role && decoded.role !== 'public_user';
      return res.redirect(isAdmin ? '/admin/dashboard' : '/');
    }
    // Token invalid — clear it and allow access
    clearTokenCookies(res);
  }
  next();
};

module.exports = { ensureAuthenticated, ensureGuest };
