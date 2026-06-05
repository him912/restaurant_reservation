const Restaurant = require("../models/Restaurant");

// ================= CREATE RESTAURANT =================
exports.createRestaurant = async (req, res) => {
  try {
    const {
      name,
      description,
      cuisineType,
      address,
      city,
      phone,
      email,
      website,
      restaurantImage,
      capacity,
      openingTime,
      closingTime,
      priceRange,
    } = req.body;

    // Validation
    if (!name || !address || !city || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "Name, address, city, phone, and email are required",
      });
    }

    const restaurant = await Restaurant.create({
      name,
      description,
      cuisineType,
      address,
      city,
      phone,
      email,
      website,
      restaurantImage,
      capacity,
      openingTime,
      closingTime,
      priceRange,
    });

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL RESTAURANTS =================
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true });

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET RESTAURANT BY ID =================
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE RESTAURANT =================
exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE RESTAURANT =================
exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Restaurant deleted successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// module.exports = {
//   createRestaurant,
//   getAllRestaurants,
//   getRestaurantById,
//   updateRestaurant,
//   deleteRestaurant,
// };
