const express = require("express");
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

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
const { protect, ownerOnly, optionalProtect } = require("../middleware/authMiddleware");

// Create restaurant
router.post("/", protect, ownerOnly, upload.single("restaurantImage"), createRestaurant);

// Get available filter values for restaurants
router.get("/filters", getRestaurantFilters);

// Owner routes - get own restaurant
router.get("/own/details", protect, ownerOnly, getOwnRestaurant);

// Owner routes - manage profile
router.put("/own/profile", protect, ownerOnly, upload.single("restaurantImage"), updateRestaurantProfile);

// Owner routes - menu management for a specific restaurant
router.post("/own/:restaurantId/menu", protect, ownerOnly, addMenuItem);
router.put("/own/:restaurantId/menu/:itemId", protect, ownerOnly, updateMenuItem);
router.delete("/own/:restaurantId/menu/:itemId", protect, ownerOnly, deleteMenuItem);

// Owner routes - gallery management
router.post(
  "/own/gallery/:restaurantId",
  protect,
  ownerOnly,
  upload.array("images", 10),
  addGalleryImage,
);
router.delete(
  "/own/gallery/:restaurantId",
  protect,
  ownerOnly,
  deleteGalleryImage,
);

// Get restaurant availability by date
router.get("/:id/availability", getRestaurantAvailability);

// Get all restaurants with search and filters
router.get("/", optionalProtect, getAllRestaurants);

// Get restaurant by ID
router.get("/:id", getRestaurantById);

// Update restaurant
router.put("/:id", protect, ownerOnly, upload.single("restaurantImage"), updateRestaurant);

// Delete restaurant
router.delete("/:id", protect, ownerOnly, deleteRestaurant);

module.exports = router;
