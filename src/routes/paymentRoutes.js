const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentController");

router.post("/create-intent", PaymentController.createPaymentIntent);

module.exports = router;

