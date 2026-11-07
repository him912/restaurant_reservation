const User = require("../models/User");
const Profile = require("../models/Profile");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const normalizeDeviceID = (value) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const sendFCMNotification = async ({
  token,
  title = "Welcome to restaurant reservation App",
  body = "You can Book your Restaurant",
  image,
  data = {},
}) => {
  const cleanToken = normalizeDeviceID(token);

  if (!cleanToken) {
    return {
      success: false,
      message: "No device token provided",
    };
  }

  const projectId = process.env.FCM_PROJECT_ID || "restaurantreservationapp-b1c5b";
  const accessToken = process.env.FCM_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      success: false,
      message: "FCM access token not configured",
    };
  }

  try {
    const payload = {
      message: {
        token: cleanToken,
        notification: {
          title,
          body,
          ...(image ? { image } : {}),
        },
        data: Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)]),
        ),
        android: {
          priority: "HIGH",
          notification: {
            sound: "default",
            channel_id: "restaurant_reservation_channel",
            ...(image ? { image } : {}),
          },
        },
        apns: {
          headers: {
            "apns-priority": "10",
          },
          payload: {
            aps: {
              sound: "default",
              badge: 1,
              "mutable-content": 1,
              "content-available": 1,
            },
          },
          ...(image
            ? {
                fcm_options: { image },
              }
            : {}),
        },
      },
    };
    // console.log("Sending FCM notification with payload:", JSON.stringify(payload, null, 2));

    // console.log(`Sending FCM notification to token: ${cleanToken}`);
    // console.log(`FCM Project ID: ${projectId}`);
    // console.log(`FCM Access Token: ${accessToken}`);



    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json().catch(() => ({}));
    // console.log("FCM response:", result);

    return {
      success: response.ok,
      status: response.status,
      result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role = "user",
      deviceID,
      deviceId,
    } = req.body;
    const finalDeviceID = normalizeDeviceID(deviceID || deviceId);

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
      ...(finalDeviceID ? { deviceID: finalDeviceID } : {}),
    });

    await Profile.create({
      user: user._id,
    });

    if (finalDeviceID) {
      await sendFCMNotification({
        token: finalDeviceID,
        title: "Welcome to restaurant reservation App",
        body: "Your account has been created successfully.",
        data: { type: "register", userId: user._id.toString() },
      });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        deviceID: user.deviceID,
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
    const { username, email, password, adminSecret, deviceID, deviceId } = req.body;
    const finalDeviceID = normalizeDeviceID(deviceID || deviceId);

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
      ...(finalDeviceID ? { deviceID: finalDeviceID } : {}),
    });

    await Profile.create({
      user: user._id,
    });

    if (finalDeviceID) {
      await sendFCMNotification({
        token: finalDeviceID,
        title: "Welcome to restaurant reservation App",
        body: "Your admin account has been created successfully.",
        data: { type: "register_admin", userId: user._id.toString() },
      });
    }

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        deviceID: user.deviceID,
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
    const { email, password, deviceID, deviceId } = req.body;
    const finalDeviceID = normalizeDeviceID(deviceID || deviceId);

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

    if (finalDeviceID) {
      if (!user.deviceID || user.deviceID !== finalDeviceID) {
        user.deviceID = finalDeviceID;
        await user.save();
      }

      await sendFCMNotification({
        token: finalDeviceID,
        title: "Welcome back",
        body: "You have successfully logged in to the restaurant reservation app.",
        data: { type: "login", userId: user._id.toString() },
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
        deviceID: user.deviceID,
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
