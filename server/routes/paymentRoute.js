const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createCheckoutSession,
  verifyPayment,
  verifyRazorpayPayment,
  markPaymentFailed,
  getPaymentConfig,
} = require("../controllers/paymentController");

router.get("/config", getPaymentConfig);
router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/verify-razorpay", protect, verifyRazorpayPayment);
router.post("/mark-failed", protect, markPaymentFailed);
router.get("/verify/:reservationId", protect, verifyPayment);

module.exports = router;
