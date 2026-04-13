const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, paymentController.getPayments);
router.post('/issue', authenticate, authorize('owner', 'admin'), paymentController.issueBill);
router.put('/:id/pay', authenticate, authorize('owner', 'admin'), paymentController.markAsPaid);
router.put('/:id/mock-pay', authenticate, authorize('tenant'), paymentController.tenantMockPay);

// Razorpay standard
router.post('/:id/razorpay-init', authenticate, authorize('tenant'), paymentController.initRazorpay);
router.post('/:id/razorpay-verify', authenticate, authorize('tenant'), paymentController.verifyRazorpay);

module.exports = router;
