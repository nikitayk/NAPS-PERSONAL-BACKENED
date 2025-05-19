const express = require("express");
const router = express.Router();
const assistantController = require("../controllers/assistantController");
const { authenticate } = require("../middlewares/authMiddleware"); // Optional, if you want to protect the endpoint

// POST /assistant
router.post("/", authenticate, assistantController.handleAssistant);

module.exports = router;
