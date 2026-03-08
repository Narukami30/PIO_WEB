const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.resolve(__dirname, '..', 'public', 'uploads');

function deleteFileIfExists(filePath) {
  if (!filePath) return;
  const absPath = path.resolve(__dirname, '..', filePath.replace(/^\//, ''));
  // Guard against path traversal — only allow deletion inside the uploads directory
  if (!absPath.startsWith(UPLOADS_ROOT)) {
    console.error('Path traversal blocked in deleteFileIfExists:', absPath);
    return;
  }
  fs.unlink(absPath, err => {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to delete file:', absPath, err);
    }
  });
}

module.exports = { deleteFileIfExists };
