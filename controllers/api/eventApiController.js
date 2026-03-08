const Event = require('../../models/Event');
const { paginate } = require('../../utils/apiHelpers');

/**
 * GET /api/v1/events
 * List published events (public)
 */
exports.list = async (req, res) => {
  try {
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;

    // By default show upcoming events; pass ?past=true for past events
    if (req.query.past === 'true') {
      filter.startDate = { $lt: new Date() };
    } else {
      filter.startDate = { $gte: new Date() };
    }

    const result = await paginate(Event, filter, {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.past === 'true' ? { startDate: -1 } : { startDate: 1 },
      populate: { path: 'department', select: 'name' }
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('API events list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

/**
 * GET /api/v1/events/:slug
 * Get single event by slug (public)
 */
exports.getBySlug = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug, isPublished: true })
      .populate('department', 'name')
      .populate('createdBy', 'firstName lastName');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (err) {
    console.error('API event detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
};
