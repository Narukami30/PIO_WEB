// Role-based access control middleware
const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error_msg', 'Please log in');
      return res.redirect('/auth/login');
    }

    if (!req.user.role) {
      req.flash('error_msg', 'No role assigned');
      return res.redirect('/admin/dashboard');
    }

    // Super admin has all permissions
    if (req.user.role.name === 'super_admin') {
      return next();
    }

    const userPermissions = req.user.role.permissions || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (hasPermission) {
      return next();
    }

    req.flash('error_msg', 'You do not have permission to access this resource');
    res.redirect('/admin/dashboard');
  };
};

module.exports = { authorize };
