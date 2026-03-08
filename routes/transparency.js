const router = require('express').Router();
const ctrl = require('../controllers/transparencyController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const auditLog = require('../middleware/auditLog');
const { uploadReport, verifyUploadMagicBytes } = require('../config/multer');

router.use(ensureAuthenticated);

router.get('/', authorize('manage_transparency', 'manage_all_content'), ctrl.index);
router.get('/create', authorize('manage_transparency', 'manage_all_content'), ctrl.create);
router.post('/', authorize('manage_transparency', 'manage_all_content'), uploadReport.single('file'), verifyUploadMagicBytes, auditLog('create', 'TransparencyReport'), ctrl.store);
router.get('/:id/edit', authorize('manage_transparency', 'manage_all_content'), ctrl.edit);
router.put('/:id', authorize('manage_transparency', 'manage_all_content'), uploadReport.single('file'), verifyUploadMagicBytes, auditLog('update', 'TransparencyReport'), ctrl.update);
router.delete('/:id', authorize('manage_transparency', 'manage_all_content'), auditLog('delete', 'TransparencyReport'), ctrl.delete);

module.exports = router;
