const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unit.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/:id', authenticate, authorize('owner', 'admin'), unitController.getUnit);

module.exports = router;
