const express = require("express");
const router = express.Router();

const {
  registerUser,
  registerAdmin,
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

// Register admin (requires ADMIN_CREATE_SECRET)
router.post("/auth/register-admin", registerAdmin);

// Login
router.post("/auth/login", loginUser);

//forgot password
router.post("/auth/forgot-password", forgotPassword);
router.get("/auth/verify-reset-token/:token", verifyResetToken);
router.post("/auth/reset-password/:token", resetPassword);

// Protected Route
router.get("/users", protect, getUserProfile);

router.patch("/users", protect, updateUserProfile);

module.exports = router;
