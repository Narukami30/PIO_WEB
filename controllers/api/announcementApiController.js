const Announcement = require('../../models/Announcement');
const { paginate } = require('../../utils/apiHelpers');

/**
 * GET /api/v1/announcements
 * List published announcements (public)
 */
exports.list = async (req, res) => {
  try {
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;

    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { excerpt: { $regex: escaped, $options: 'i' } }
      ];
    }

    const result = await paginate(Announcement, filter, {
      page: req.query.page,
      limit: req.query.limit,
      sort: { isPinned: -1, publishedAt: -1 },
      populate: { path: 'department', select: 'name' }
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('API announcements list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
};

/**
 * GET /api/v1/announcements/:slug
 * Get single published announcement by slug (public)
 */
exports.getBySlug = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ slug: req.params.slug, isPublished: true })
      .populate('department', 'name')
      .populate('createdBy', 'firstName lastName');

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    announcement.views += 1;
    await announcement.save();

    const related = await Announcement.find({
      isPublished: true,
      category: announcement.category,
      _id: { $ne: announcement._id }
    }).limit(3).sort({ publishedAt: -1 }).select('title slug excerpt image publishedAt category');

    res.json({
      success: true,
      data: announcement,
      related
    });
  } catch (err) {
    console.error('API announcement detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch announcement' });
  }
};
