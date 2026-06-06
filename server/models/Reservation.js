const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["reserved", "cancelled"],
      default: "reserved",
    },
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);
