const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const auditLog = require('../middleware/auditLog');

router.use(ensureAuthenticated);

router.get('/', authorize('manage_users'), ctrl.index);
router.get('/create', authorize('manage_users'), ctrl.create);
router.post('/', authorize('manage_users'), auditLog('create', 'User'), ctrl.store);
router.get('/:id/edit', authorize('manage_users'), ctrl.edit);
router.put('/:id', authorize('manage_users'), auditLog('update', 'User'), ctrl.update);
router.delete('/:id', authorize('manage_users'), auditLog('delete', 'User'), ctrl.delete);

module.exports = router;
