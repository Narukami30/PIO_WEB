const DisasterUpdate = require('../../models/DisasterUpdate');
const { paginate } = require('../../utils/apiHelpers');

/**
 * GET /api/v1/disaster-updates
 * List active, published disaster updates (public)
 */
exports.list = async (req, res) => {
  try {
    const filter = { isPublished: true, isActive: true };
    if (req.query.alertLevel) filter.alertLevel = req.query.alertLevel;
    if (req.query.type) filter.type = req.query.type;

    const result = await paginate(DisasterUpdate, filter, {
      page: req.query.page,
      limit: req.query.limit,
      sort: { createdAt: -1 }
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('API disaster updates error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch disaster updates' });
  }
};

/**
 * GET /api/v1/disaster-updates/:id
 * Get single disaster update (public)
 */
exports.getById = async (req, res) => {
  try {
    const update = await DisasterUpdate.findOne({
      _id: req.params.id,
      isPublished: true,
      isActive: true
    }).populate('createdBy', 'firstName lastName');

    if (!update) {
      return res.status(404).json({ success: false, message: 'Disaster update not found' });
    }

    res.json({ success: true, data: update });
  } catch (err) {
    console.error('API disaster update detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch disaster update' });
  }
};
