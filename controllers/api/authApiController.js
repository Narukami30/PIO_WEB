const User = require('../../models/User');
const Role = require('../../models/Role');
const AuditLog = require('../../models/AuditLog');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');

/**
 * POST /api/v1/auth/login
 * Returns access + refresh tokens as JSON (for mobile clients)
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('role').populate('department');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await AuditLog.create({
      user: user._id,
      action: 'login',
      resource: 'Auth',
      resourceId: user._id,
      details: 'Mobile API login',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role ? { name: user.role.name, displayName: user.role.displayName } : null,
          department: user.department ? { id: user.department._id, name: user.department.name } : null
        }
      }
    });
  } catch (err) {
    console.error('API login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

/**
 * POST /api/v1/auth/register
 * Citizen self-registration — always gets public_user role
 */
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one number' });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one special character' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const publicRole = await Role.findOne({ name: 'public_user' });
    if (!publicRole) {
      return res.status(500).json({ success: false, message: 'Registration is not available' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashed,
      role: publicRole._id
    });

    const fullUser = await User.findById(user._id).populate('role').populate('department');

    const accessToken = generateAccessToken(fullUser);
    const refreshToken = generateRefreshToken(fullUser);

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: fullUser._id,
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          email: fullUser.email,
          role: fullUser.role ? { name: fullUser.role.name, displayName: fullUser.role.displayName } : null
        }
      }
    });
  } catch (err) {
    console.error('API register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

/**
 * POST /api/v1/auth/refresh
 * Exchange refresh token for new access + refresh tokens
 */
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id).populate('role').populate('department');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (err) {
    console.error('API refresh error:', err);
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

/**
 * GET /api/v1/auth/me
 * Get current authenticated user's profile
 */
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone,
      avatar: req.user.avatar,
      role: req.user.role ? { name: req.user.role.name, displayName: req.user.role.displayName } : null,
      department: req.user.department ? { id: req.user.department._id, name: req.user.department.name } : null
    }
  });
};
