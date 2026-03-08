const Service = require('../../models/Service');
const { paginate } = require('../../utils/apiHelpers');

/**
 * GET /api/v1/services
 * List active services (public)
 */
exports.list = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.department) filter.department = req.query.department;

    const result = await paginate(Service, filter, {
      page: req.query.page,
      limit: req.query.limit,
      sort: { order: 1 },
      populate: { path: 'department', select: 'name code' }
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('API services list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

/**
 * GET /api/v1/services/:id
 * Get single service detail (public)
 */
exports.getById = async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, isActive: true })
      .populate('department', 'name code');

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({ success: true, data: service });
  } catch (err) {
    console.error('API service detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch service' });
  }
};
