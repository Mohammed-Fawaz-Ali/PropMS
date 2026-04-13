const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, ticketController.getTickets);
router.post('/', authenticate, authorize('tenant'), ticketController.createTicket);
router.put('/:id', authenticate, authorize('owner', 'admin'), ticketController.updateTicket);

module.exports = router;
