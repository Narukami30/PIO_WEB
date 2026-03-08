/**
 * Standardized API response helpers
 */

const paginate = async (Model, filter, options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit) || 15));
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };

  let query = Model.find(filter).sort(sort).skip(skip).limit(limit);

  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach(p => { query = query.populate(p); });
    } else {
      query = query.populate(options.populate);
    }
  }

  if (options.select) {
    query = query.select(options.select);
  }

  const [data, total] = await Promise.all([
    query.exec(),
    Model.countDocuments(filter)
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = { paginate };
