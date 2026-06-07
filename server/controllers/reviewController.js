const Review = require("../models/Review");
const Restaurant = require("../models/Restaurant");
const mongoose = require("mongoose");

const updateRestaurantRating = async (restaurantId) => {
  const reviews = await Review.find({ restaurantId });
  const rating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  await Restaurant.findByIdAndUpdate(restaurantId, { rating }, { returnDocument: "after" });
};

exports.createReview = async (req, res) => {
  try {
    const { restaurantId, rating, comment, photos } = req.body;
    const userId = req.user?.id;

    if (!restaurantId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "restaurantId and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "rating must be a number between 1 and 5",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or inactive",
      });
    }

    const existingReview = await Review.findOne({ restaurantId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review for this restaurant",
      });
    }

    const review = await Review.create({
      restaurantId,
      userId,
      rating,
      comment,
      photos: Array.isArray(photos) ? photos.filter((p) => p) : [],
    });

    await updateRestaurantRating(restaurantId);
    const populatedReview = await review.populate("userId", "username email");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: populatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getReviewsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or inactive",
      });
    }

    const reviews = await Review.find({ restaurantId })
      .populate("userId", "username email")
      .populate("responses.userId", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { rating, comment, photos } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this review",
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "rating must be a number between 1 and 5",
        });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    if (photos !== undefined && Array.isArray(photos)) {
      review.photos = photos.filter((p) => p);
    }

    await review.save();
    await updateRestaurantRating(review.restaurantId);
    const populatedReview = await review.populate("userId", "username email");

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: populatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
    }

    const restaurantId = review.restaurantId;
    await review.deleteOne();
    await updateRestaurantRating(restaurantId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addReviewResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Response comment is required",
      });
    }

    const review = await Review.findById(id).populate("restaurantId");
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (!review.restaurantId.ownerId || review.restaurantId.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only restaurant owner can respond to reviews",
      });
    }

    const response = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      comment: comment.trim(),
      createdAt: new Date(),
    };

    review.responses.push(response);
    await review.save();

    const populatedReview = await review.populate(
      "responses.userId",
      "username email"
    );

    res.status(201).json({
      success: true,
      message: "Response added successfully",
      data: populatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateReviewResponse = async (req, res) => {
  try {
    const { id, responseId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Response comment is required",
      });
    }

    const review = await Review.findById(id).populate("restaurantId");
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const response = review.responses.find((r) => r._id.toString() === responseId);
    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Response not found",
      });
    }

    if (response.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this response",
      });
    }

    response.comment = comment.trim();
    await review.save();

    const populatedReview = await review.populate(
      "responses.userId",
      "username email"
    );

    res.status(200).json({
      success: true,
      message: "Response updated successfully",
      data: populatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteReviewResponse = async (req, res) => {
  try {
    const { id, responseId } = req.params;
    const userId = req.user?.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const response = review.responses.find((r) => r._id.toString() === responseId);
    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Response not found",
      });
    }

    if (response.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this response",
      });
    }

    review.responses = review.responses.filter(
      (r) => r._id.toString() !== responseId
    );
    await review.save();

    const populatedReview = await review.populate(
      "responses.userId",
      "username email"
    );

    res.status(200).json({
      success: true,
      message: "Response deleted successfully",
      data: populatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
