// Simple cookie-based flash message middleware
// Usage: app.use(require('./middleware/cookie-flash'))

const COOKIE_NAME = 'flash_msg';

function setFlash(res, type, msg) {
  const value = JSON.stringify({ type, msg });
  res.cookie(COOKIE_NAME, value, { httpOnly: true, sameSite: 'lax', maxAge: 5 * 60 * 1000 });
}

function getFlash(req, res) {
  let flash = null;
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    try {
      flash = JSON.parse(req.cookies[COOKIE_NAME]);
    } catch (e) {
      flash = null;
    }
    res.clearCookie(COOKIE_NAME);
  }
  return flash;
}

module.exports = function cookieFlash(req, res, next) {
  req.flash = (type, msg) => setFlash(res, type, msg);
  res.locals.getFlash = () => getFlash(req, res);
  next();
};
