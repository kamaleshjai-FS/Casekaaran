const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

router.get('/brands', brandController.getBrands);
router.get('/brands/:brandSlug/models', brandController.getBrandModels);
router.get('/models/popular', brandController.getPopularModels);

module.exports = router;
