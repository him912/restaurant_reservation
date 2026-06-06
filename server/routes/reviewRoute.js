const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createReview,
  getReviewsByRestaurant,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

router.post("/", protect, createReview);
router.get("/restaurant/:restaurantId", getReviewsByRestaurant);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;
