const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('owner', 'admin'), tenantController.getTenants);
router.post('/', authenticate, authorize('owner', 'admin'), tenantController.addTenant);
router.put('/:id', authenticate, authorize('owner', 'admin'), tenantController.updateTenant);
router.delete('/:id', authenticate, authorize('owner', 'admin'), tenantController.deleteTenant);

// Tenant context routes
router.get('/my/tenancy', authenticate, authorize('tenant'), tenantController.getMyTenancy);
router.post('/my/sign', authenticate, authorize('tenant'), tenantController.signLease);

module.exports = router;
