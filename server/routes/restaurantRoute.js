const express = require("express");
const router = express.Router();

const {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantFilters,
  getOwnRestaurant,
  updateRestaurantProfile,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addGalleryImage,
  deleteGalleryImage,
} = require("../controllers/restaurantController");
const { getRestaurantAvailability } = require("../controllers/reservationController");
const { protect } = require("../middleware/authMiddleware");

// Create restaurant
router.post("/", protect, createRestaurant);

// Get available filter values for restaurants
router.get("/filters", protect, getRestaurantFilters);

// Owner routes - get own restaurant
router.get("/own/details", protect, getOwnRestaurant);

// Owner routes - manage profile
router.put("/own/profile", protect, updateRestaurantProfile);

// Owner routes - menu management
router.post("/own/menu", protect, addMenuItem);
router.put("/own/menu/:itemId", protect, updateMenuItem);
router.delete("/own/menu/:itemId", protect, deleteMenuItem);

// Owner routes - gallery management
router.post("/own/gallery", protect, addGalleryImage);
router.delete("/own/gallery", protect, deleteGalleryImage);

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
