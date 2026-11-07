const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "restaurant_owner", "admin"],
      default: "user",
    },

    deviceID: {
      type: String,
      default: null,
      index: true,
    },

    resetToken: String,
    resetTokenExpiry: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
