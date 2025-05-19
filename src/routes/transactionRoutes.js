const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middlewares/authMiddleware');

// Create a new transaction
router.post('/', authenticate, transactionController.createTransaction);

// Get all transactions for the authenticated user
router.get('/', authenticate, transactionController.getTransactions);

// Get details for a specific transaction
router.get('/:id', authenticate, transactionController.getTransactionDetails);

module.exports = router;
