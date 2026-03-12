// ...existing code...
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const { setTokenCookies, clearTokenCookies, verifyToken, verifyRefreshToken, JWT_REFRESH_COOKIE_NAME } = require('../utils/jwt');

exports.getLogin = (req, res) => {
  res.render('auth/login', {
    layout: 'layouts/auth',
    title: 'Login'
  });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error_msg', 'Please enter email and password');
      return res.redirect('/auth/login');
    }

    // Find user with role populated
    const user = await User.findOne({ email: email.toLowerCase() }).populate('role').populate('department');

    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    if (!user.isActive) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    // Check account lockout
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      req.flash('error_msg', `Account temporarily locked. Try again in ${minutesLeft} minute(s).`);
      return res.redirect('/auth/login');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment failed attempts
      const updates = { $inc: { failedLoginAttempts: 1 } };
      if (user.failedLoginAttempts + 1 >= MAX_ATTEMPTS) {
        updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION) };
      }
      await User.updateOne({ _id: user._id }, updates);
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    // Successful password — reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // Check if 2FA is required (all roles except public_user)
    const requireOtp = user.role && user.role.name !== 'public_user';

    if (!requireOtp) {
      // Public user — skip OTP, login directly
      user.lastLogin = new Date();
      await user.save();
      setTokenCookies(res, user);
      await AuditLog.create({
        user: user._id,
        action: 'login',
        resource: 'Auth',
        resourceId: user._id,
        details: 'User logged in (JWT)',
        ipAddress: req.ip
      });
      return res.redirect('/');
    }

    // Admin role — generate OTP and require verification
    const crypto = require('crypto');
    const otpRaw = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash('sha256').update(otpRaw).digest('hex');
    user.otpCode = otpHash;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpAttempts = 0;
    await user.save();

    // Send OTP email — errors are caught so a transient SMTP outage doesn't block login
    const { sendOtpEmail } = require('../utils/mailer');
    try {
      await sendOtpEmail(user.email, user.firstName, otpRaw);
    } catch (emailErr) {
      console.error('OTP email delivery failed:', emailErr.message);
      // Clean up the pending OTP so the account is left in a consistent state
      await User.updateOne({ _id: user._id }, { otpCode: null, otpExpires: null, otpAttempts: 0 });
      req.flash('error_msg', 'Email service is currently unavailable. Please try again later or contact the administrator.');
      return res.redirect('/auth/login');
    }

    // Issue short-lived pending cookie (NOT a full auth token)
    const jwtLib = require('jsonwebtoken');
    const pendingToken = jwtLib.sign(
      { userId: user._id.toString(), type: '2fa_pending' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('pio_2fa_pending', pendingToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000
    });

    req.flash('success_msg', 'A 6-digit verification code has been sent to your email.');
    res.redirect('/auth/verify-otp');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error_msg', 'Login failed. Please try again.');
    res.redirect('/auth/login');
  }
};

exports.getRegister = async (req, res) => {
  res.render('auth/register', {
    layout: 'layouts/auth',
    title: 'Register'
  });
};

exports.postRegister = async (req, res) => {
  try {
    const { firstName, lastName, email, password, password2 } = req.body;
    const errors = [];

    if (!firstName || !lastName || !email || !password || !password2) {
      errors.push({ msg: 'Please fill in all fields' });
    }
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 8) {
      errors.push({ msg: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      errors.push({ msg: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      errors.push({ msg: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      errors.push({ msg: 'Password must contain at least one number' });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push({ msg: 'Password must contain at least one special character' });
    }

    if (errors.length > 0) {
      return res.render('auth/register', {
        layout: 'layouts/auth',
        title: 'Register',
        errors,
        firstName, lastName, email
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/auth/register');
    }

    // Default to public_user role
    const publicRole = await Role.findOne({ name: 'public_user' });
    if (!publicRole) {
      req.flash('error_msg', 'Registration is temporarily unavailable. Please contact the administrator.');
      return res.redirect('/auth/register');
    }

    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: publicRole._id
    });

    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'create',
      resource: 'User',
      resourceId: user._id,
      details: 'New user registration',
      ipAddress: req.ip
    });

    req.flash('success_msg', 'Registration successful! Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Registration failed. Please try again.');
    res.redirect('/auth/register');
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Audit log (if token is present, decode user id)
    const { verifyToken, JWT_COOKIE_NAME } = require('../utils/jwt');
    const token = req.cookies ? req.cookies[JWT_COOKIE_NAME] : null;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        await AuditLog.create({
          user: decoded.id,
          action: 'logout',
          resource: 'Auth',
          resourceId: decoded.id,
          details: 'User logged out (JWT)',
          ipAddress: req.ip
        });
      }
    }
  } catch (e) {
    // Ignore audit errors on logout
  }

  // Clear JWT cookies
  clearTokenCookies(res);

  // ...existing code...

  req.flash('success_msg', 'You have been logged out');
  res.redirect('/auth/login');
};

exports.getVerifyOtp = (req, res) => {
  const pendingToken = req.cookies && req.cookies['pio_2fa_pending'];
  if (!pendingToken) {
    req.flash('error_msg', 'Session expired. Please log in again.');
    return res.redirect('/auth/login');
  }
  try {
    const jwtLib = require('jsonwebtoken');
    jwtLib.verify(pendingToken, process.env.JWT_SECRET);
  } catch {
    res.clearCookie('pio_2fa_pending');
    req.flash('error_msg', 'Session expired. Please log in again.');
    return res.redirect('/auth/login');
  }
  res.render('auth/verify-otp', { layout: 'layouts/auth', title: 'Verify Login' });
};

exports.postVerifyOtp = async (req, res) => {
  try {
    const pendingToken = req.cookies && req.cookies['pio_2fa_pending'];
    if (!pendingToken) {
      req.flash('error_msg', 'Session expired. Please log in again.');
      return res.redirect('/auth/login');
    }

    const jwtLib = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwtLib.verify(pendingToken, process.env.JWT_SECRET);
    } catch {
      res.clearCookie('pio_2fa_pending');
      req.flash('error_msg', 'Session expired. Please log in again.');
      return res.redirect('/auth/login');
    }

    if (decoded.type !== '2fa_pending') {
      res.clearCookie('pio_2fa_pending');
      req.flash('error_msg', 'Invalid session. Please log in again.');
      return res.redirect('/auth/login');
    }

    const user = await User.findById(decoded.userId).populate('role').populate('department');
    if (!user || !user.isActive) {
      res.clearCookie('pio_2fa_pending');
      req.flash('error_msg', 'Account not found or deactivated.');
      return res.redirect('/auth/login');
    }

    // OTP expired?
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      res.clearCookie('pio_2fa_pending');
      await User.updateOne({ _id: user._id }, { otpCode: null, otpExpires: null, otpAttempts: 0 });
      req.flash('error_msg', 'Verification code expired. Please log in again.');
      return res.redirect('/auth/login');
    }

    // Too many OTP attempts?
    if (user.otpAttempts >= 5) {
      res.clearCookie('pio_2fa_pending');
      await User.updateOne({ _id: user._id }, { otpCode: null, otpExpires: null, otpAttempts: 0 });
      req.flash('error_msg', 'Too many failed attempts. Please log in again.');
      return res.redirect('/auth/login');
    }

    // Compare submitted OTP (hash comparison)
    const crypto = require('crypto');
    const submittedHash = crypto.createHash('sha256').update(String(req.body.otp || '').trim()).digest('hex');
    if (submittedHash !== user.otpCode) {
      await User.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });
      const remaining = 5 - (user.otpAttempts + 1);
      req.flash('error_msg', `Invalid code. ${remaining} attempt(s) remaining.`);
      return res.redirect('/auth/verify-otp');
    }

    // OTP valid — clear 2FA fields and complete login
    await User.updateOne({ _id: user._id }, {
      otpCode: null, otpExpires: null, otpAttempts: 0, lastLogin: new Date()
    });
    res.clearCookie('pio_2fa_pending');
    setTokenCookies(res, user);

    await AuditLog.create({
      user: user._id,
      action: 'login',
      resource: 'Auth',
      resourceId: user._id,
      details: 'User logged in with 2FA (JWT)',
      ipAddress: req.ip
    });

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('2FA verify error:', err);
    req.flash('error_msg', 'Verification failed. Please try again.');
    res.redirect('/auth/verify-otp');
  }
};

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies ? req.cookies[JWT_REFRESH_COOKIE_NAME] : null;

    if (!refreshToken) {
      req.flash('error_msg', 'Session expired. Please log in again.');
      return res.redirect('/auth/login');
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      clearTokenCookies(res);
      req.flash('error_msg', 'Session expired. Please log in again.');
      return res.redirect('/auth/login');
    }

    // Lookup user fresh from DB
    const user = await User.findById(decoded.id).populate('role').populate('department');
    if (!user || !user.isActive) {
      clearTokenCookies(res);
      req.flash('error_msg', 'Account not found or deactivated.');
      return res.redirect('/auth/login');
    }

    // Re-issue tokens
    setTokenCookies(res, user);
    const referer = req.get('Referrer');
    if (referer && !referer.includes('/auth/refresh')) {
      return res.redirect(referer);
    }
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Token refresh error:', err);
    clearTokenCookies(res);
    req.flash('error_msg', 'Session expired. Please log in again.');
    res.redirect('/auth/login');
  }
};

// ---- Password Reset Flow ----

exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { layout: 'layouts/auth', title: 'Forgot Password' });
};

exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Always show the same message to prevent email enumeration
    const genericMsg = 'If an account with that email exists, a password reset link has been sent.';

    if (!email) {
      req.flash('success_msg', genericMsg);
      return res.redirect('/auth/forgot-password');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      req.flash('success_msg', genericMsg);
      return res.redirect('/auth/forgot-password');
    }

    const crypto = require('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${baseUrl}/auth/reset-password/${rawToken}`;

    const { sendResetEmail } = require('../utils/mailer');
    try {
      await sendResetEmail(user.email, user.firstName, resetUrl);
    } catch (emailErr) {
      console.error('Password-reset email delivery failed:', emailErr.message);
      // Clean up the reset token so the account is left in a consistent state
      await User.updateOne({ _id: user._id }, { resetToken: null, resetExpires: null });
      req.flash('error_msg', 'Email service is currently unavailable. Please try again later or contact the administrator.');
      return res.redirect('/auth/forgot-password');
    }

    await AuditLog.create({
      user: user._id,
      action: 'update',
      resource: 'Auth',
      resourceId: user._id,
      details: 'Password reset link requested',
      ipAddress: req.ip
    });

    req.flash('success_msg', genericMsg);
    res.redirect('/auth/forgot-password');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('error_msg', 'Something went wrong. Please try again.');
    res.redirect('/auth/forgot-password');
  }
};

exports.getResetPassword = async (req, res) => {
  try {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetToken: hashedToken,
      resetExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error_msg', 'Reset link is invalid or has expired.');
      return res.redirect('/auth/forgot-password');
    }

    res.render('auth/reset-password', {
      layout: 'layouts/auth',
      title: 'Reset Password',
      token: req.params.token
    });
  } catch (err) {
    console.error('Get reset password error:', err);
    req.flash('error_msg', 'Something went wrong.');
    res.redirect('/auth/forgot-password');
  }
};

exports.postResetPassword = async (req, res) => {
  try {
    const { password, password2 } = req.body;
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error_msg', 'Reset link is invalid or has expired.');
      return res.redirect('/auth/forgot-password');
    }

    if (!password || password.length < 8) {
      req.flash('error_msg', 'Password must be at least 8 characters.');
      return res.redirect(`/auth/reset-password/${req.params.token}`);
    }
    if (password !== password2) {
      req.flash('error_msg', 'Passwords do not match.');
      return res.redirect(`/auth/reset-password/${req.params.token}`);
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      req.flash('error_msg', 'Password must contain uppercase, lowercase, number, and special character.');
      return res.redirect(`/auth/reset-password/${req.params.token}`);
    }

    user.password = password; // hashed by pre-save hook
    user.resetToken = null;
    user.resetExpires = null;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'update',
      resource: 'Auth',
      resourceId: user._id,
      details: 'Password reset completed',
      ipAddress: req.ip
    });

    req.flash('success_msg', 'Password has been reset successfully. Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Reset password error:', err);
    req.flash('error_msg', 'Something went wrong. Please try again.');
    res.redirect('/auth/forgot-password');
  }
};
