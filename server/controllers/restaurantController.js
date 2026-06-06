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

// Helper to safely build regular expressions from query text
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ================= GET ALL RESTAURANTS =================
exports.getAllRestaurants = async (req, res) => {
  try {
    const {
      search,
      city,
      cuisineType,
      priceRange,
      ratingMin,
      ratingMax,
      capacityMin,
      capacityMax,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      const regex = new RegExp(escapeRegExp(search), "i");
      query.$or = [
        { name: regex },
        { description: regex },
        { city: regex },
        { address: regex },
        { cuisineType: regex },
      ];
    }

    if (city) {
      query.city = new RegExp(`^${escapeRegExp(city)}$`, "i");
    }

    if (cuisineType) {
      const cuisines = cuisineType
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (cuisines.length) {
        query.cuisineType = { $in: cuisines };
      }
    }

    if (priceRange) {
      const prices = priceRange
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (prices.length) {
        query.priceRange = { $in: prices };
      }
    }

    if (ratingMin || ratingMax) {
      query.rating = {};
      if (ratingMin) query.rating.$gte = Number(ratingMin);
      if (ratingMax) query.rating.$lte = Number(ratingMax);
    }

    if (capacityMin || capacityMax) {
      query.capacity = {};
      if (capacityMin) query.capacity.$gte = Number(capacityMin);
      if (capacityMax) query.capacity.$lte = Number(capacityMax);
    }

    const sortFields = ["name", "rating", "priceRange", "city", "createdAt"];
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sort = sortFields.includes(sortBy)
      ? { [sortBy]: sortDirection }
      : { createdAt: -1 };

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 20;

    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .sort(sort)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
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

// ================= GET RESTAURANT FILTER VALUES =================
exports.getRestaurantFilters = async (req, res) => {
  try {
    const [cities, cuisines, priceRanges] = await Promise.all([
      Restaurant.distinct("city", { isActive: true }),
      Restaurant.distinct("cuisineType", { isActive: true }),
      Restaurant.distinct("priceRange", { isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        cities,
        cuisines,
        priceRanges,
      },
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
