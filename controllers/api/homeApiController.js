const Announcement = require('../../models/Announcement');
const Event = require('../../models/Event');
const DisasterUpdate = require('../../models/DisasterUpdate');
const SiteSettings = require('../../models/SiteSettings');

/**
 * GET /api/v1/home
 * Home screen data bundle — latest announcements, upcoming events, active disaster alerts
 * Reduces mobile round trips by combining multiple queries
 */
exports.home = async (req, res) => {
  try {
    const [announcements, events, disasterUpdates, siteSettings] = await Promise.all([
      Announcement.find({ isPublished: true })
        .sort({ isPinned: -1, publishedAt: -1 })
        .limit(6)
        .select('title slug excerpt image category isPinned publishedAt'),
      Event.find({ isPublished: true, startDate: { $gte: new Date() } })
        .sort({ startDate: 1 })
        .limit(4)
        .select('title slug description location startDate endDate image category'),
      DisasterUpdate.find({ isPublished: true, isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title content alertLevel type affectedBarangays createdAt'),
      SiteSettings.getSettings()
    ]);

    res.json({
      success: true,
      data: {
        announcements,
        events,
        disasterUpdates,
        settings: {
          heroImage: siteSettings.heroImage,
          heroLogo: siteSettings.heroLogo,
          aboutNaujanTitle: siteSettings.aboutNaujanTitle,
          aboutNaujanDescription: siteSettings.aboutNaujanDescription
        }
      }
    });
  } catch (err) {
    console.error('API home error:', err);
    res.status(500).json({ success: false, message: 'Failed to load home data' });
  }
};
