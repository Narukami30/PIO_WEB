const Document = require('../../models/Document');
const { paginate } = require('../../utils/apiHelpers');

/**
 * GET /api/v1/documents
 * List published documents (public)
 */
exports.list = async (req, res) => {
  try {
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;

    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } }
      ];
    }

    const result = await paginate(Document, filter, {
      page: req.query.page,
      limit: req.query.limit,
      sort: { createdAt: -1 },
      populate: { path: 'department', select: 'name' }
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('API documents list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

/**
 * GET /api/v1/documents/:id
 * Get single document metadata (authenticated — mirrors web upload access control)
 */
exports.getById = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, isPublished: true })
      .populate('department', 'name')
      .populate('uploadedBy', 'firstName lastName');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Increment download counter
    doc.downloads += 1;
    await doc.save();

    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('API document detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch document' });
  }
};
