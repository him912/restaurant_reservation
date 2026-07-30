const User = require("../models/User");
const Profile = require("../models/Profile");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const { username, email, password , role = "user"} = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const allowedRoles = ["user", "restaurant_owner","admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await Profile.create({
      user: user._id,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= REGISTER ADMIN =================
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password, adminSecret } = req.body;

    if (!username || !email || !password || !adminSecret) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and adminSecret must be provided",
      });
    }

    if (adminSecret !== process.env.ADMIN_CREATE_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin secret",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await Profile.create({
      user: user._id,
    });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET USER PROFILE =================
const getUserProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      "username email",
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        username: profile.user.username,
        email: profile.user.email,
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        profileImage: profile.profileImage,
        favoriteCuisines: profile.favoriteCuisines,
        dietaryPreferences: profile.dietaryPreferences,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE USER PROFILE =================
const updateUserProfile = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      profileImage,
      favoriteCuisines,
      dietaryPreferences,
    } = req.body;

    const update = {};
    if (fullName !== undefined) update.fullName = fullName;
    if (phoneNumber !== undefined) update.phoneNumber = phoneNumber;
    if (profileImage !== undefined) update.profileImage = profileImage;
    if (favoriteCuisines !== undefined)
      update.favoriteCuisines = favoriteCuisines;
    if (dietaryPreferences !== undefined)
      update.dietaryPreferences = dietaryPreferences;

    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: update, $setOnInsert: { user: req.user.id } },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).populate("user", "username email");

    res.status(200).json({
      success: true,
      data: {
        username: profile.user.username,
        email: profile.user.email,
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        profileImage: profile.profileImage,
        favoriteCuisines: profile.favoriteCuisines,
        dietaryPreferences: profile.dietaryPreferences,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
