const router = require('express').Router();
const ctrl = require('../controllers/documentController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const auditLog = require('../middleware/auditLog');
const { uploadDocument, verifyUploadMagicBytes } = require('../config/multer');
const { documentRules, validateRequest } = require('../middleware/validators');

router.use(ensureAuthenticated);

router.get('/', authorize('manage_documents', 'manage_all_content'), ctrl.index);
router.get('/create', authorize('manage_documents', 'manage_all_content'), ctrl.create);
router.post('/', authorize('manage_documents', 'manage_all_content'), uploadDocument.single('file'), verifyUploadMagicBytes, documentRules, validateRequest('/admin/documents/create'), auditLog('create', 'Document'), ctrl.store);
router.get('/:id/edit', authorize('manage_documents', 'manage_all_content'), ctrl.edit);
router.put('/:id', authorize('manage_documents', 'manage_all_content'), uploadDocument.single('file'), verifyUploadMagicBytes, documentRules, validateRequest('back'), auditLog('update', 'Document'), ctrl.update);
router.delete('/:id', authorize('manage_documents', 'manage_all_content'), auditLog('delete', 'Document'), ctrl.delete);

module.exports = router;
