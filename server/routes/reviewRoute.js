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

router.post("/", protect, upload.array("images", 10), createReview);
router.get("/restaurant/:restaurantId", getReviewsByRestaurant);
router.put("/:id", protect, upload.array("images", 10), updateReview);
router.delete("/:id", protect, deleteReview);

// Review response routes
router.post("/:id/responses", protect, addReviewResponse);
router.put("/:id/responses/:responseId", protect, updateReviewResponse);
router.delete("/:id/responses/:responseId", protect, deleteReviewResponse);

module.exports = router;
