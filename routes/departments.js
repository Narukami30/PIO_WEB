const router = require('express').Router();
const ctrl = require('../controllers/departmentController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const auditLog = require('../middleware/auditLog');
const { uploadImage, verifyUploadMagicBytes } = require('../config/multer');

router.use(ensureAuthenticated);

router.get('/', authorize('manage_departments', 'manage_all_content'), ctrl.index);
router.get('/create', authorize('manage_departments', 'manage_all_content'), ctrl.create);
router.post('/', authorize('manage_departments', 'manage_all_content'), uploadImage.single('image'), verifyUploadMagicBytes, auditLog('create', 'Department'), ctrl.store);
router.get('/:id/edit', authorize('manage_departments', 'manage_all_content'), ctrl.edit);
router.put('/:id', authorize('manage_departments', 'manage_all_content'), uploadImage.single('image'), verifyUploadMagicBytes, auditLog('update', 'Department'), ctrl.update);
router.delete('/:id', authorize('manage_departments', 'manage_all_content'), auditLog('delete', 'Department'), ctrl.delete);

module.exports = router;
