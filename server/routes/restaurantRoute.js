const express = require("express");
const router = express.Router();

const {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurantController");
const protect = require("../middleware/authMiddleware");

// Create restaurant
router.post("/", protect, createRestaurant);

// Get all restaurants
router.get("/", protect, getAllRestaurants);

// Get restaurant by ID
router.get("/:id", protect, getRestaurantById);

// Update restaurant
router.put("/:id", protect, updateRestaurant);

// Delete restaurant
router.delete("/:id", protect, deleteRestaurant);

module.exports = router;
