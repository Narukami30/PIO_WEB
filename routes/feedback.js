const router = require('express').Router();
const ctrl = require('../controllers/feedbackController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(ensureAuthenticated);

router.get('/', authorize('manage_feedback', 'manage_all_content'), ctrl.index);
router.get('/:id', authorize('manage_feedback', 'manage_all_content'), ctrl.view);
router.post('/:id/respond', authorize('manage_feedback', 'manage_all_content'), ctrl.respond);
router.put('/:id/archive', authorize('manage_feedback', 'manage_all_content'), ctrl.archive);
router.delete('/:id', authorize('manage_feedback', 'manage_all_content'), ctrl.delete);

module.exports = router;
