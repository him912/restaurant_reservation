const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createReview,
  getReviewsByRestaurant,
  updateReview,
  deleteReview,
  addReviewResponse,
  updateReviewResponse,
  deleteReviewResponse,
} = require("../controllers/reviewController");

router.post("/", protect, createReview);
router.get("/restaurant/:restaurantId", getReviewsByRestaurant);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

// Review response routes
router.post("/:id/responses", protect, addReviewResponse);
router.put("/:id/responses/:responseId", protect, updateReviewResponse);
router.delete("/:id/responses/:responseId", protect, deleteReviewResponse);

module.exports = router;
