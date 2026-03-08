const Department = require('../../models/Department');
const Service = require('../../models/Service');

/**
 * GET /api/v1/departments
 * List active departments (public)
 */
exports.list = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .select('name code description head headTitle email phone location image');

    res.json({ success: true, data: departments });
  } catch (err) {
    console.error('API departments list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

/**
 * GET /api/v1/departments/:id
 * Get department details with its services (public)
 */
exports.getById = async (req, res) => {
  try {
    const department = await Department.findOne({ _id: req.params.id, isActive: true });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const services = await Service.find({ department: department._id, isActive: true })
      .sort({ order: 1 })
      .select('name description requirements steps fees processingTime');

    res.json({ success: true, data: { ...department.toObject(), services } });
  } catch (err) {
    console.error('API department detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch department' });
  }
};
