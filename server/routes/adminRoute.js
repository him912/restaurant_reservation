const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getAllRestaurantsAdmin,
  toggleRestaurantStatus,
  getAllReviewsAdmin,
  deleteReviewAdmin,
  getAllReservationsAdmin,
  cancelReservationAdmin,
  getAllUsersAdmin,
  updateUserRole,
  getRestaurantStats,
} = require("../controllers/adminController");

// Dashboard
router.get("/dashboard", protect, adminOnly, getDashboardStats);

// Restaurant management
router.get("/restaurants", protect, adminOnly, getAllRestaurantsAdmin);
router.put("/restaurants/:id/status", protect, adminOnly, toggleRestaurantStatus);
router.get("/restaurants/:id/stats", protect, adminOnly, getRestaurantStats);

// Review management
router.get("/reviews", protect, adminOnly, getAllReviewsAdmin);
router.delete("/reviews/:id", protect, adminOnly, deleteReviewAdmin);

// Reservation management
router.get("/reservations", protect, adminOnly, getAllReservationsAdmin);
router.put("/reservations/:id/cancel", protect, adminOnly, cancelReservationAdmin);

// User management
router.get("/users", protect, adminOnly, getAllUsersAdmin);
router.put("/users/:id/role", protect, adminOnly, updateUserRole);

module.exports = router;
