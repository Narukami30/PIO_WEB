const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'naujan-pio-jwt-secret-change-in-production') {
  throw new Error('JWT_SECRET environment variable must be set and not use the default value.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_COOKIE_NAME = 'pio_token';
const JWT_REFRESH_COOKIE_NAME = 'pio_refresh';

/**
 * Generate an access token
 */
function generateAccessToken(user) {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role ? (user.role.name || user.role) : null,
    roleId: user.role ? (user.role._id || user.role) : null
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate a refresh token (longer lived)
 */
function generateRefreshToken(user) {
  const payload = {
    id: user._id || user.id,
    type: 'refresh'
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Verify and decode a token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Verify and decode a refresh token (uses separate secret)
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Set JWT cookies on response (httpOnly, secure in production)
 */
function setTokenCookies(res, user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const isProduction = process.env.NODE_ENV === 'production';

  // Access token cookie — short-lived
  res.cookie(JWT_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });

  // Refresh token cookie — longer-lived
  res.cookie(JWT_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/auth',               // Only sent to auth routes (token refresh)
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return { accessToken, refreshToken };
}

/**
 * Clear JWT cookies on logout
 */
function clearTokenCookies(res) {
  res.clearCookie(JWT_COOKIE_NAME, { httpOnly: true, sameSite: 'strict' });
  res.clearCookie(JWT_REFRESH_COOKIE_NAME, { httpOnly: true, sameSite: 'strict', path: '/auth' });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  JWT_COOKIE_NAME,
  JWT_REFRESH_COOKIE_NAME,
  JWT_SECRET
};
