const router = require('express').Router();
const ctrl = require('../controllers/serviceController');
const { ensureAuthenticated } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { serviceRules, validateRequest } = require('../middleware/validators');

router.use(ensureAuthenticated);

router.get('/', authorize('manage_services', 'manage_all_content'), ctrl.index);
router.get('/create', authorize('manage_services', 'manage_all_content'), ctrl.create);
router.post('/', authorize('manage_services', 'manage_all_content'), serviceRules, validateRequest('/admin/services/create'), ctrl.store);
router.get('/:id/edit', authorize('manage_services', 'manage_all_content'), ctrl.edit);
router.put('/:id', authorize('manage_services', 'manage_all_content'), serviceRules, validateRequest('back'), ctrl.update);
router.delete('/:id', authorize('manage_services', 'manage_all_content'), ctrl.delete);

module.exports = router;
