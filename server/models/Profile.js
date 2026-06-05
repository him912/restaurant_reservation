const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    favoriteCuisines: [{ type: String }],
    dietaryPreferences: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.Profile || mongoose.model("Profile", profileSchema);

// module.exports = mongoose.model("Profile", profileSchema);
