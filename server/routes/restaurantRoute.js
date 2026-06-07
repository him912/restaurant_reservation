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
const { protect, ownerOnly } = require("../middleware/authMiddleware");

// Create restaurant
router.post("/", protect, createRestaurant);

// Get available filter values for restaurants
router.get("/filters", protect, getRestaurantFilters);

// Owner routes - get own restaurant
router.get("/own/details", protect, ownerOnly, getOwnRestaurant);

// Owner routes - manage profile
router.put("/own/profile", protect, ownerOnly, updateRestaurantProfile);

// Owner routes - menu management
router.post("/own/menu", protect, ownerOnly, addMenuItem);
router.put("/own/menu/:itemId", protect, ownerOnly, updateMenuItem);
router.delete("/own/menu/:itemId", protect, ownerOnly, deleteMenuItem);

// Owner routes - gallery management
router.post("/own/gallery", protect, ownerOnly, addGalleryImage);
router.delete("/own/gallery", protect, ownerOnly, deleteGalleryImage);

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
