const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({})
        .populate('role', 'displayName name')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      User.countDocuments({})
    ]);

    res.render('admin/users/index', {
      layout: 'layouts/admin',
      title: 'Users',
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading users');
    res.redirect('/admin/dashboard');
  }
};

exports.create = async (req, res) => {
  const [roles, departments] = await Promise.all([
    Role.find({}).sort('displayName'),
    Department.find({ isActive: true }).sort('name')
  ]);

  res.render('admin/users/form', {
    layout: 'layouts/admin',
    title: 'New User',
    editUser: {},
    roles, departments, isEdit: false
  });
};

exports.store = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, phone, isActive } = req.body;


    const selectedRole = await Role.findById(role);
    if (!selectedRole) {
      req.flash('error_msg', 'Invalid role selected');
      return res.redirect('/admin/users/create');
    }

    // Enforce only one super_admin
    if (selectedRole.name === 'super_admin') {
      const superAdminCount = await User.countDocuments({ role: selectedRole._id });
      if (superAdminCount > 0) {
        req.flash('error_msg', 'There can only be one super admin user.');
        return res.redirect('/admin/users/create');
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash('error_msg', 'Email already in use');
      return res.redirect('/admin/users/create');
    }

    const user = new User({
      firstName, lastName,
      email: email.toLowerCase(),
      password, role,
      department: department || undefined,
      phone,
      isActive: isActive === 'on'
    });

    await user.save();
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'create',
      resource: 'User',
      resourceId: user._id,
      details: `Created user: ${user.email}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'User created');
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating user');
    res.redirect('/admin/users/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const [userRecord, roles, departments] = await Promise.all([
      User.findById(req.params.id).populate('role'),
      Role.find({}).sort('displayName'),
      Department.find({ isActive: true }).sort('name')
    ]);

    if (!userRecord) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }

    res.render('admin/users/form', {
      layout: 'layouts/admin',
      title: 'Edit User',
      editUser: userRecord,
      roles,
      departments,
      isEdit: true
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
};

exports.update = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, phone, isActive } = req.body;
    const editPath = `/admin/users/${req.params.id}/edit`;
    const userRecord = await User.findById(req.params.id).populate('role');

    if (!userRecord) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }


    const selectedRole = await Role.findById(role);
    if (!selectedRole) {
      req.flash('error_msg', 'Invalid role selected');
      return res.redirect(editPath);
    }

    // Enforce only one super_admin
    if (selectedRole.name === 'super_admin' && (!userRecord.role || userRecord.role.name !== 'super_admin')) {
      const superAdminCount = await User.countDocuments({ role: selectedRole._id });
      if (superAdminCount > 0) {
        req.flash('error_msg', 'There can only be one super admin user.');
        return res.redirect(editPath);
      }
    }

    const duplicate = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: userRecord._id }
    });
    if (duplicate) {
      req.flash('error_msg', 'Email already in use by another account');
      return res.redirect(editPath);
    }

    const isTargetSelf = userRecord._id.toString() === req.user._id.toString();
    const willBeActive = isActive === 'on';
    const willBeSuperAdmin = selectedRole.name === 'super_admin';
    const isCurrentlySuperAdmin = userRecord.role && userRecord.role.name === 'super_admin';

    if (isTargetSelf && (!willBeActive || !willBeSuperAdmin)) {
      req.flash('error_msg', 'You cannot deactivate your own account or remove your own super admin role');
      return res.redirect(editPath);
    }

    if (isCurrentlySuperAdmin && (!willBeActive || !willBeSuperAdmin)) {
      const superAdminRole = await Role.findOne({ name: 'super_admin' });
      if (superAdminRole) {
        const activeSuperAdminCount = await User.countDocuments({
          role: superAdminRole._id,
          isActive: true,
          _id: { $ne: userRecord._id }
        });

        if (activeSuperAdminCount === 0) {
          req.flash('error_msg', 'At least one active super admin account must remain');
          return res.redirect(editPath);
        }
      }
    }

    userRecord.firstName = firstName;
    userRecord.lastName = lastName;
    userRecord.email = email.toLowerCase();
    userRecord.role = role;
    // Explicitly unset department if falsy (empty, null, undefined)
    if (department) {
      userRecord.department = department;
    } else {
      userRecord.department = undefined;
    }
    userRecord.phone = phone;
    userRecord.isActive = isActive === 'on';

    if (password && password.length >= 8) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordRegex.test(password)) {
        req.flash('error', 'Password must include uppercase, lowercase, number, and special character');
        return res.redirect(`/admin/users/${req.params.id}/edit`);
      }
      userRecord.password = password;
    }

    await userRecord.save();
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'update',
      resource: 'User',
      resourceId: userRecord._id,
      details: `Updated user: ${userRecord.email}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'User updated');
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating user');
    res.redirect(`/admin/users/${req.params.id}/edit`);
  }
};

exports.delete = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      req.flash('error_msg', 'Cannot delete your own account');
      return res.redirect('/admin/users');
    }

    let userToDelete = await User.findById(req.params.id).populate('role');
    if (!userToDelete) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }

    if (userToDelete.role && userToDelete.role.name === 'super_admin' && userToDelete.isActive) {
      const superAdminRole = await Role.findOne({ name: 'super_admin' });
      if (superAdminRole) {
        const activeSuperAdminCount = await User.countDocuments({
          role: superAdminRole._id,
          isActive: true,
          _id: { $ne: userToDelete._id }
        });

        if (activeSuperAdminCount === 0) {
          req.flash('error_msg', 'Cannot delete the last active super admin account');
          return res.redirect('/admin/users');
        }
      }
    }

    await User.findByIdAndDelete(req.params.id);
    await require('../models/AuditLog').create({
      user: req.user ? req.user._id : null,
      action: 'delete',
      resource: 'User',
      resourceId: req.params.id,
      details: userToDelete ? `Deleted user: ${userToDelete.email}` : 'Deleted user',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get ? req.get('User-Agent') : ''
    });
    req.flash('success_msg', 'User deleted');
    res.redirect('/admin/users');
      await User.findByIdAndDelete(req.params.id);
      await require('../models/AuditLog').create({
        user: req.user ? req.user._id : null,
        action: 'delete',
        resource: 'User',
        resourceId: req.params.id,
        details: userToDelete ? `Deleted user: ${userToDelete.email}` : 'Deleted user',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get ? req.get('User-Agent') : ''
      });
      req.flash('success_msg', 'User deleted');
      res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting user');
    res.redirect('/admin/users');
  }
};
