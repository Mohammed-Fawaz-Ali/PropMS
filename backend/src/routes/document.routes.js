const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate, authorize('owner', 'admin'));

router.get('/templates', documentController.getGlobalDocuments);
router.post('/templates', documentController.saveGlobalDocument);

module.exports = router;
