const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

/**
 * API authentication middleware — reads JWT from Authorization: Bearer <token>
 * For mobile app clients that can't use httpOnly cookies.
 */
const apiAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id)
      .populate('role')
      .populate('department')
      .select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('API auth error:', err);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

/**
 * API role-based authorization — checks permissions array.
 * Super admin bypasses all checks.
 */
const apiAuthorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!req.user.role) {
      return res.status(403).json({ success: false, message: 'No role assigned' });
    }

    if (req.user.role.name === 'super_admin') {
      return next();
    }

    const userPermissions = req.user.role.permissions || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (hasPermission) {
      return next();
    }

    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  };
};

module.exports = { apiAuthenticate, apiAuthorize };
