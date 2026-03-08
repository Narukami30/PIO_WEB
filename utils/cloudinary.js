const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Determine Cloudinary resource_type from MIME type.
 */
function getResourceType(mimetype) {
  if (!mimetype) return 'auto';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'raw'; // PDFs, Office docs, etc.
}

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer from multer memory storage
 * @param {Object} options
 * @param {string} options.folder - Cloudinary folder (e.g. 'pio_naujan/images')
 * @param {string} options.mimetype - MIME type of the file
 * @param {string} [options.publicId] - Optional custom public ID
 * @returns {Promise<{url: string, publicId: string}>}
 */
function uploadToCloudinary(buffer, { folder, mimetype, publicId }) {
  const resourceType = getResourceType(mimetype);

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType
    };
    if (publicId) uploadOptions.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });

    stream.end(buffer);
  });
}

/**
 * Extract the public_id from a Cloudinary URL.
 * Returns null for non-Cloudinary URLs (local paths).
 */
function getPublicIdFromUrl(url) {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    // URL pattern: https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{version}/{public_id}.{ext}
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    // Remove version prefix (v1234567890/) and file extension
    const afterUpload = parts[1].replace(/^v\d+\//, '');
    // Remove file extension for image/video (raw keeps extension in public_id)
    return afterUpload.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
}

/**
 * Delete a file from Cloudinary by URL.
 * Silently ignores non-Cloudinary URLs (local file paths).
 */
async function deleteFromCloudinary(url) {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;

  // Try each resource type — Cloudinary requires the correct one
  for (const type of ['image', 'raw', 'video']) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: type });
      if (result.result === 'ok') return;
    } catch {
      // continue trying other types
    }
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
  getResourceType
};
