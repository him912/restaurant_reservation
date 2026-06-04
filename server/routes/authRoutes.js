const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/authController");

const {
  forgotPassword,
  verifyResetToken,
  resetPassword,
} = require("../controllers/forgetController");

const protect = require("../middleware/authMiddleware");

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Protected Route
router.get("/profile", protect, getUserProfile);

//forgot password
router.post("/forgot-password", forgotPassword);
///verify-reset-token
router.get("/verify-reset-token/:token", verifyResetToken);
//reset-password
router.post("/reset-password/:token", resetPassword);

module.exports = router;
