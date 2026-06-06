const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");

const {
  forgotPassword,
  verifyResetToken,
  resetPassword,
} = require("../controllers/forgetController");

const { protect } = require("../middleware/authMiddleware");

// Register
router.post("/auth/register", registerUser);

// Login
router.post("/auth/login", loginUser);

//forgot password
router.post("/auth/forgot-password", forgotPassword);
///verify-reset-token
router.get("/verify-reset-token/:token", verifyResetToken);
//reset-password
router.post("/reset-password/:token", resetPassword);

// Protected Route
router.get("/users", protect, getUserProfile);

router.patch("/users", protect, updateUserProfile);

module.exports = router;
