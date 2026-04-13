const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

const authenticate = require('../middleware/authenticate');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateMe);
router.delete('/me', authenticate, authController.deleteMe);

module.exports = router;
