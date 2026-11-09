const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const brandRoutes = require('./brandRoutes');
const productRoutes = require('./productRoutes');
const checkoutRoutes = require('./checkoutRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/', brandRoutes);
router.use('/', productRoutes);
router.use('/', checkoutRoutes);
router.use('/', paymentRoutes);
router.use('/admin', adminRoutes);

// Healthcheck
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Casekaaran Core API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
