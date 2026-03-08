const TransparencyReport = require('../../models/TransparencyReport');
const { paginate } = require('../../utils/apiHelpers');

/**
 * GET /api/v1/transparency
 * List published transparency reports (public)
 */
exports.list = async (req, res) => {
  try {
    const filter = { isPublished: true };
    if (req.query.type) filter.reportType = req.query.type;
    if (req.query.year) filter.fiscalYear = parseInt(req.query.year);
    if (req.query.quarter) filter.quarter = req.query.quarter;

    const result = await paginate(TransparencyReport, filter, {
      page: req.query.page,
      limit: req.query.limit,
      sort: { fiscalYear: -1, createdAt: -1 }
    });

    // Also return distinct fiscal years for filter dropdowns
    const years = await TransparencyReport.distinct('fiscalYear', { isPublished: true });

    res.json({
      success: true,
      ...result,
      filters: { years: years.sort((a, b) => b - a) }
    });
  } catch (err) {
    console.error('API transparency list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch transparency reports' });
  }
};

/**
 * GET /api/v1/transparency/:id
 * Get single transparency report (public)
 */
exports.getById = async (req, res) => {
  try {
    const report = await TransparencyReport.findOne({ _id: req.params.id, isPublished: true })
      .populate('uploadedBy', 'firstName lastName');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Transparency report not found' });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('API transparency detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch transparency report' });
  }
};
