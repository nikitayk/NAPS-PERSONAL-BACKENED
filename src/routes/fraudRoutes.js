const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');
const { authenticate } = require('../middlewares/authMiddleware');

// Analyze a transaction for fraud risk
router.post('/score', authenticate, fraudController.scoreTransaction);

// List recent fraud alerts
router.get('/alerts', authenticate, fraudController.listFraudAlerts);

module.exports = router;
