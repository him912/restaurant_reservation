const Restaurant = require("../models/Restaurant");
const cloudinary = require("../utils/cloudinary");

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
      features,
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
      features,
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
    if (req.user?.role === "restaurant_owner") {
      query.ownerId = req.user.id;
    }

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

// ================= GET OWN RESTAURANT (OWNER) =================
exports.getOwnRestaurant = async (req, res) => {
  try {
    const ownerId = req.user?.id;

    const restaurant = await Restaurant.findOne({ ownerId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "You don't own any restaurant",
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

// ================= UPDATE RESTAURANT PROFILE (OWNER) =================
exports.updateRestaurantProfile = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const {
      name,
      description,
      cuisineType,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      restaurantImage,
      capacity,
      openingTime,
      closingTime,
      closedDays,
      priceRange,
    } = req.body;

    const restaurant = await Restaurant.findOne({ ownerId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "You don't own any restaurant",
      });
    }

    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (cuisineType !== undefined) update.cuisineType = cuisineType;
    if (address !== undefined) update.address = address;
    if (city !== undefined) update.city = city;
    if (state !== undefined) update.state = state;
    if (zipCode !== undefined) update.zipCode = zipCode;
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;
    if (website !== undefined) update.website = website;
    if (restaurantImage !== undefined) update.restaurantImage = restaurantImage;
    if (capacity !== undefined) update.capacity = capacity;
    if (openingTime !== undefined) update.openingTime = openingTime;
    if (closingTime !== undefined) update.closingTime = closingTime;
    if (closedDays !== undefined) update.closedDays = closedDays;
    if (priceRange !== undefined) update.priceRange = priceRange;

    const updatedRestaurant = await Restaurant.findOneAndUpdate({ ownerId }, update, {
      returnDocument: "after",
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Restaurant profile updated successfully",
      data: updatedRestaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= ADD MENU ITEM =================
exports.addMenuItem = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { restaurantId } = req.params;
    const { name, description, category, price, image } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "restaurantId is required",
      });
    }

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "name and price are required",
      });
    }

    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or you are not the owner",
      });
    }

    const menuItem = {
      name,
      description: description || "",
      category: category || "",
      price,
      image: image || "",
      available: true,
    };

    restaurant.menuItems.push(menuItem);
    await restaurant.save();

    res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE MENU ITEM =================
exports.updateMenuItem = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { restaurantId, itemId } = req.params;
    const { name, description, category, price, image, available } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "restaurantId is required",
      });
    }

    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or you are not the owner",
      });
    }

    const menuItem = restaurant.menuItems.find((item) => item._id.toString() === itemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    if (name !== undefined) menuItem.name = name;
    if (description !== undefined) menuItem.description = description;
    if (category !== undefined) menuItem.category = category;
    if (price !== undefined) menuItem.price = price;
    if (image !== undefined) menuItem.image = image;
    if (available !== undefined) menuItem.available = available;

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE MENU ITEM =================
exports.deleteMenuItem = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { restaurantId, itemId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "restaurantId is required",
      });
    }

    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or you are not the owner",
      });
    }

    restaurant.menuItems = restaurant.menuItems.filter(
      (item) => item._id.toString() !== itemId,
    );
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= ADD GALLERY IMAGE =================
exports.addGalleryImage = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { imageUrl } = req.body;
    const { restaurantId } = req.params;
    const files = req.files || (req.file ? [req.file] : []);
    const galleryUrls = [];

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "restaurantId is required",
      });
    }

    if (!imageUrl && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "imageUrl or image file is required",
      });
    }

    if (files.length) {
      for (const file of files) {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "restaurant_gallery" },
            (error, uploadedImage) => {
              if (error) return reject(error);
              resolve(uploadedImage);
            },
          );

          uploadStream.end(file.buffer);
        });

        galleryUrls.push(result.secure_url);
      }
    }

    if (imageUrl) {
      galleryUrls.push(imageUrl);
    }

    const restaurant = await Restaurant.findOne({ ownerId, _id: restaurantId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or you do not own this restaurant",
      });
    }

    restaurant.gallery.push(...galleryUrls);
    await restaurant.save();

    res.status(201).json({
      success: true,
      message: "Gallery image added successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE GALLERY IMAGE =================
exports.deleteGalleryImage = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { restaurantId } = req.params;
    const { imageUrl } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "restaurantId is required",
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "imageUrl is required",
      });
    }

    const restaurant = await Restaurant.findOne({ ownerId, _id: restaurantId });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or you do not own this restaurant",
      });
    }

    restaurant.gallery = restaurant.gallery.filter((img) => img !== imageUrl);
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Gallery image deleted successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

