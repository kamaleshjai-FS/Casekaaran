const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyCashfreeWebhook = require('../middleware/verifyCashfree');

// Cashfree signed webhook listener
router.post('/webhooks/cashfree', verifyCashfreeWebhook, paymentController.handleWebhook);

// Customer read-only order status check
router.get('/orders/:orderNumber/status', paymentController.getOrderStatus);

module.exports = router;
