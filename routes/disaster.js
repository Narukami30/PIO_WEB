const router = require('express').Router();
const ctrl = require('../controllers/disasterController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { formatDate, statusBadgeClass, alertLevelClass, truncate, formatFileSize } = require('../utils/helpers');
const { disasterRules, validateRequest } = require('../middleware/validators');

// Make helpers available in disaster views
router.use((req, res, next) => {
  res.locals.formatDate = formatDate;
  res.locals.statusBadgeClass = statusBadgeClass;
  res.locals.alertLevelClass = alertLevelClass;
  res.locals.truncate = truncate;
  res.locals.formatFileSize = formatFileSize;
  next();
});

router.use(ensureAuthenticated);

router.get('/', authorize('manage_disaster', 'manage_all_content'), ctrl.index);
router.get('/create', authorize('manage_disaster', 'manage_all_content'), ctrl.create);
router.post('/', authorize('manage_disaster', 'manage_all_content'), disasterRules, validateRequest('/admin/disaster/create'), ctrl.store);
router.get('/:id/edit', authorize('manage_disaster', 'manage_all_content'), ctrl.edit);
router.put('/:id', authorize('manage_disaster', 'manage_all_content'), disasterRules, validateRequest('back'), ctrl.update);
router.patch('/:id/toggle-publish', authorize('manage_disaster', 'manage_all_content'), ctrl.togglePublish);
router.delete('/:id', authorize('manage_disaster', 'manage_all_content'), ctrl.delete);

module.exports = router;
