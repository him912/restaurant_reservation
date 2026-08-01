const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const Reservation = require("../models/Reservation");
const Review = require("../models/Review");
const User = require("../models/User");
const { broadcastAvailabilityUpdate } = require("../sockets/availabilitySocket");

const getReservedSeats = async (restaurantId, date, time) => {
  const filter = {
    restaurantId,
    date,
    status: "reserved",
  };
  if (time) {
    filter.time = time;
  }

  const reservations = await Reservation.find(filter);
  return reservations.reduce((sum, reservation) => sum + reservation.partySize, 0);
};

// ================= ADMIN DASHBOARD =================
exports.getDashboardStats = async (req, res) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({ isActive: true });
    const totalReservations = await Reservation.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOwners = await User.countDocuments({ role: "restaurant_owner" });

    const recentReservations = await Reservation.find()
      .populate("restaurantId", "name")
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .limit(10);

    const recentReviews = await Review.find()
      .populate("userId", "username")
      .populate("restaurantId", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRestaurants,
          activeRestaurants,
          totalReservations,
          totalReviews,
          totalUsers,
          totalOwners,
        },
        recentReservations,
        recentReviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL RESTAURANTS (ADMIN) =================
exports.getAllRestaurantsAdmin = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { city: regex }];
    }

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 20;

    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .populate("ownerId", "username email")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= TOGGLE RESTAURANT STATUS (ADMIN) =================
exports.toggleRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: `Restaurant ${restaurant.isActive ? "activated" : "deactivated"}`,
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL REVIEWS (ADMIN) =================
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const { rating, restaurant, page = 1, limit = 50 } = req.query;

    const query = {};
    if (rating) query.rating = Number(rating);
    if (restaurant) query.restaurantId = restaurant;

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 50;

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate("userId", "username email")
      .populate("restaurantId", "name")
      .populate("responses.userId", "username email role")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= REPLY TO REVIEW (ADMIN) =================
exports.replyToReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;

    if (!comment || !String(comment).trim()) {
      return res.status(400).json({
        success: false,
        message: "Response comment is required",
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.responses.push({
      _id: new mongoose.Types.ObjectId(),
      userId,
      comment: String(comment).trim(),
      createdAt: new Date(),
    });
    await review.save();

    const populated = await Review.findById(id)
      .populate("userId", "username email")
      .populate("restaurantId", "name")
      .populate("responses.userId", "username email role");

    res.status(201).json({
      success: true,
      message: "Admin reply added",
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE REVIEW (ADMIN) =================
exports.deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const restaurantId = review.restaurantId;
    await review.deleteOne();

    // Recalculate restaurant rating after deletion
    const remaining = await Review.find({ restaurantId });
    const averageRating = remaining.length
      ? remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length
      : 0;
    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: Number(averageRating.toFixed(1)),
    });

    res.status(200).json({
      success: true,
      message: "Review deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL RESERVATIONS (ADMIN) =================
exports.getAllReservationsAdmin = async (req, res) => {
  try {
    const { status, restaurant, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (restaurant) query.restaurantId = restaurant;

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 20;

    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
      .populate("restaurantId", "name")
      .populate("userId", "username email")
      .sort({ date: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE RESERVATION STATUS (ADMIN) =================
exports.updateReservationStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const io = req.app.get("io");

    if (!["reserved", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be reserved or cancelled",
      });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    if (status === "reserved") {
      const restaurant = await Restaurant.findById(reservation.restaurantId);
      if (!restaurant || !restaurant.isActive) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found or inactive",
        });
      }

      let reservedSeats = await getReservedSeats(
        reservation.restaurantId,
        reservation.date,
        reservation.time,
      );

      if (reservation.status === "reserved") {
        reservedSeats -= reservation.partySize;
      }

      if (reservedSeats + reservation.partySize > restaurant.capacity) {
        return res.status(400).json({
          success: false,
          message: "Not enough seats available for the requested time",
        });
      }
    }

    reservation.status = status;
    await reservation.save();

    if (io) {
      const date = reservation.date.toISOString().split("T")[0];
      broadcastAvailabilityUpdate(io, reservation.restaurantId.toString(), date);
    }

    const updated = await Reservation.findById(id)
      .populate("restaurantId", "name")
      .populate("userId", "username email");

    res.status(200).json({
      success: true,
      message: `Reservation ${status === "reserved" ? "accepted" : "rejected"}`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= CANCEL RESERVATION (ADMIN) =================
exports.cancelReservationAdmin = async (req, res) => {
  try {
    req.body = { status: "cancelled" };
    return exports.updateReservationStatusAdmin(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL USERS (ADMIN) =================
exports.getAllUsersAdmin = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 20;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE USER ROLE (ADMIN) =================
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "restaurant_owner", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { returnDocument: "after" },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET RESTAURANT STATISTICS (ADMIN) =================
exports.getRestaurantStats = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id).populate("ownerId", "username email");
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const reviewCount = await Review.countDocuments({ restaurantId: id });
    const reservationCount = await Reservation.countDocuments({ restaurantId: id });
    const avgRating =
      (await Review.aggregate([
        { $match: { restaurantId: restaurant._id } },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ])) || [];

    res.status(200).json({
      success: true,
      data: {
        restaurant,
        reviewCount,
        reservationCount,
        averageRating: avgRating[0]?.avg || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= ASSIGN OWNER TO RESTAURANT (ADMIN) =================
exports.assignOwnerToRestaurant = async (req, res) => {
  try {
    const { id } = req.params; // restaurant id
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Ensure user has restaurant_owner role
    if (user.role !== "restaurant_owner") {
      user.role = "restaurant_owner";
      await user.save();
    }

    restaurant.ownerId = user._id;
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Owner assigned to restaurant",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
