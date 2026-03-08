const router = require('express').Router();
const ctrl = require('../controllers/complaintController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(ensureAuthenticated);

router.get('/', authorize('manage_complaints', 'manage_all_content'), ctrl.index);
router.get('/:id/report', authorize('manage_complaints', 'manage_all_content'), ctrl.report);
router.get('/:id', authorize('manage_complaints', 'manage_all_content'), ctrl.view);
router.post('/:id/status', authorize('manage_complaints', 'manage_all_content'), ctrl.updateStatus);
router.delete('/:id', authorize('manage_complaints', 'manage_all_content'), ctrl.delete);

module.exports = router;
