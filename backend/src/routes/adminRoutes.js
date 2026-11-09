const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/authMiddleware');

// All admin routes protected by cookie JWT authentication
router.use(authenticateAdmin);

router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/orders', adminController.getOrders);
router.patch('/orders/:orderNumber/shipping', adminController.updateOrderShipping);
router.put('/inventory/:variantId', adminController.updateInventoryStock);
router.get('/notifications', adminController.getNotificationLogs);
router.post('/reports/sync-sheets', adminController.triggerSheetsSync);

module.exports = router;
