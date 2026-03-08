const AuditLog = require('../models/AuditLog');

const auditLog = (action, resource) => {
  return async (req, res, next) => {
    // Store original end method
    const originalEnd = res.end;

    res.end = function (...args) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 400) {
        AuditLog.create({
          user: req.user ? req.user._id : null,
          action,
          resource,
          resourceId: req.params.id || null,
          details: `${req.method} ${req.originalUrl}`,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || ''
        }).catch(err => console.error('Audit log error:', err));
      }

      originalEnd.apply(res, args);
    };

    next();
  };
};

module.exports = auditLog;
