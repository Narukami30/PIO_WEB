const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique tracking code for complaints
 * Format: NJN-YYYYMMDD-XXXX
 */
const generateTrackingCode = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = uuidv4().split('-')[0].toUpperCase().slice(0, 6);
  return `NJN-${y}${m}${d}-${suffix}`;
};

/**
 * Format date for display
 */
const formatDate = (date, format = 'long') => {
  if (!date) return '';
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

/**
 * Truncate text
 */
const truncate = (text, length = 150) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get alert level class
 */
const alertLevelClass = (level) => {
  const classes = {
    info: 'info',
    advisory: 'primary',
    warning: 'warning',
    critical: 'danger'
  };
  return classes[level] || 'secondary';
};

/**
 * Get status badge class
 */
const statusBadgeClass = (status) => {
  const classes = {
    submitted: 'secondary',
    under_review: 'info',
    in_progress: 'primary',
    resolved: 'success',
    closed: 'dark',
    rejected: 'danger',
    new: 'warning',
    read: 'info',
    responded: 'success',
    archived: 'dark'
  };
  return classes[status] || 'secondary';
};

module.exports = {
  generateTrackingCode,
  formatDate,
  truncate,
  formatFileSize,
  alertLevelClass,
  statusBadgeClass
};
