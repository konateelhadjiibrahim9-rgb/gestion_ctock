const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// GET /api/stats/stock-summary - Résumé du stock
router.get('/stock-summary', statsController.getStockSummary);

module.exports = router;