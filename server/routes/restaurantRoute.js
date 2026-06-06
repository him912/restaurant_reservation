const express = require("express");
const router = express.Router();

const {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantFilters,
} = require("../controllers/restaurantController");
const { getRestaurantAvailability } = require("../controllers/reservationController");
const protect = require("../middleware/authMiddleware");

// Create restaurant
router.post("/", protect, createRestaurant);

// Get available filter values for restaurants
router.get("/filters", protect, getRestaurantFilters);

// Get restaurant availability by date
router.get("/:id/availability", protect, getRestaurantAvailability);

// Get all restaurants with search and filters
router.get("/", protect, getAllRestaurants);

// Get restaurant by ID
router.get("/:id", protect, getRestaurantById);

// Update restaurant
router.put("/:id", protect, updateRestaurant);

// Delete restaurant
router.delete("/:id", protect, deleteRestaurant);

module.exports = router;
