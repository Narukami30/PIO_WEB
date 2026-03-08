const multer = require('multer');
const path = require('path');
const FileType = require('file-type');

// Allowed extensions mapped by category
const ALLOWED_DOC_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.mp4', '.mpeg'
];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Memory storage — files are kept in buffer for Cloudinary upload
const memoryStorage = multer.memoryStorage();

// File filter — checks MIME type AND extension
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4', 'video/mpeg'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(file.mimetype) || !ALLOWED_DOC_EXTENSIONS.includes(ext)) {
    return cb(new Error('Invalid file type. Allowed: images, PDF, Office documents, videos.'), false);
  }
  cb(null, true);
};

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(file.mimetype) || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP).'), false);
  }
  cb(null, true);
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

const uploadDocument = multer({ storage: memoryStorage, fileFilter, limits: { fileSize: maxSize } });
const uploadImage = multer({ storage: memoryStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadReport = multer({ storage: memoryStorage, fileFilter, limits: { fileSize: maxSize } });

module.exports = { uploadDocument, uploadImage, uploadReport };

/**
 * Middleware: verify uploaded file's magic bytes match its claimed extension.
 * Use AFTER multer middleware in the route chain.
 * Works with memory storage (buffer) — rejects and returns 400 if mismatch detected.
 */
const verifyUploadMagicBytes = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await FileType.fromBuffer(req.file.buffer);
    // Some files (e.g. .doc, .csv, plain text) may not have detectable magic bytes — allow them
    if (result) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      // Map detected MIME to expected extensions
      const mimeToExt = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp'],
        'application/pdf': ['.pdf'],
        'video/mp4': ['.mp4'],
        'application/zip': ['.docx', '.xlsx', '.pptx'], // Office Open XML uses ZIP container
      };
      const allowedExts = mimeToExt[result.mime];
      if (allowedExts && !allowedExts.includes(ext)) {
        req.flash('error_msg', 'File content does not match its extension. Upload rejected.');
        return res.redirect('back');
      }
    }
    next();
  } catch (err) {
    next(); // On error reading, allow through (multer already validated)
  }
};

module.exports.verifyUploadMagicBytes = verifyUploadMagicBytes;
