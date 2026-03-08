const router = require('express').Router();
const ctrl = require('../controllers/eventController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const auditLog = require('../middleware/auditLog');
const { uploadImage } = require('../config/multer');
const { eventRules, validateRequest } = require('../middleware/validators');

router.use(ensureAuthenticated);

router.get('/', authorize('manage_events', 'manage_all_content'), ctrl.index);
router.get('/create', authorize('manage_events', 'manage_all_content'), ctrl.create);
router.post('/', authorize('manage_events', 'manage_all_content'), uploadImage.single('image'), eventRules, validateRequest('/admin/events/create'), auditLog('create', 'Event'), ctrl.store);
router.get('/:id/edit', authorize('manage_events', 'manage_all_content'), ctrl.edit);
router.put('/:id', authorize('manage_events', 'manage_all_content'), uploadImage.single('image'), eventRules, validateRequest('back'), auditLog('update', 'Event'), ctrl.update);
router.delete('/:id', authorize('manage_events', 'manage_all_content'), auditLog('delete', 'Event'), ctrl.delete);

module.exports = router;
