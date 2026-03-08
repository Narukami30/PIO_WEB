const router = require('express').Router();
const ctrl = require('../controllers/announcementController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const auditLog = require('../middleware/auditLog');
const { uploadImage, verifyUploadMagicBytes } = require('../config/multer');
const { announcementRules, validateRequest } = require('../middleware/validators');

router.use(ensureAuthenticated);

router.get('/', authorize('manage_announcements', 'manage_all_content'), ctrl.index);
router.get('/create', authorize('manage_announcements', 'manage_all_content'), ctrl.create);
router.post('/', authorize('manage_announcements', 'manage_all_content'), uploadImage.single('image'), verifyUploadMagicBytes, announcementRules, validateRequest('/admin/announcements/create'), auditLog('create', 'Announcement'), ctrl.store);
router.get('/:id/edit', authorize('manage_announcements', 'manage_all_content'), ctrl.edit);
router.put('/:id', authorize('manage_announcements', 'manage_all_content'), uploadImage.single('image'), verifyUploadMagicBytes, announcementRules, validateRequest('back'), auditLog('update', 'Announcement'), ctrl.update);
router.delete('/:id', authorize('manage_announcements', 'manage_all_content'), auditLog('delete', 'Announcement'), ctrl.delete);

module.exports = router;
