const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { checkoutLimiter } = require('../middleware/rateLimiter');

router.post('/checkout', checkoutLimiter, checkoutController.processCheckout);

module.exports = router;
