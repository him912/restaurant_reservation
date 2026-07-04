const Restaurant = require("../models/Restaurant");
const Reservation = require("../models/Reservation");
const { broadcastAvailabilityUpdate } = require("../sockets/availabilitySocket");

const parseDate = (dateString) => {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
};

const isValidTime = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

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

exports.createReservation = async (req, res) => {
  try {
    const { restaurantId, date, time, partySize } = req.body;
    const userId = req.user?.id;
    const io = req.app.get("io");

    if (!restaurantId || !date || !time || !partySize) {
      return res.status(400).json({
        success: false,
        message: "restaurantId, date, time, and partySize are required",
      });
    }

    if (!isValidTime(time)) {
      return res.status(400).json({
        success: false,
        message: "time must be in HH:mm format",
      });
    }

    const reservationDate = parseDate(date);
    if (!reservationDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or inactive",
      });
    }

    const reservedSeats = await getReservedSeats(restaurantId, reservationDate, time);
    if (reservedSeats + Number(partySize) > restaurant.capacity) {
      return res.status(400).json({
        success: false,
        message: "Not enough seats available for the requested time",
      });
    }

    const reservation = await Reservation.create({
      restaurantId,
      restaurantImage: restaurant.image || "",
      userId,
      date: reservationDate,
      time,
      partySize,
    });

    // Broadcast availability update to all subscribed clients
    if (io) {
      broadcastAvailabilityUpdate(io, restaurantId.toString(), date);
    }

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const reservations = await Reservation.find({ userId, status: "reserved" })
      .populate("restaurantId", "name city address capacity image")
      .sort({ date: -1, time: 1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { restaurantId, date, time, partySize } = req.body;
    const io = req.app.get("io");

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    if (reservation.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this reservation",
      });
    }

    const updatedRestaurantId = restaurantId || reservation.restaurantId;
    const updatedDate = date ? parseDate(date) : reservation.date;
    const updatedTime = time || reservation.time;
    const updatedPartySize = partySize || reservation.partySize;

    if (!isValidTime(updatedTime)) {
      return res.status(400).json({
        success: false,
        message: "time must be in HH:mm format",
      });
    }

    if (!updatedDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const status = req.body.status;
    if (status && !["reserved", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const restaurant = await Restaurant.findById(updatedRestaurantId);
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or inactive",
      });
    }

    if (status !== "cancelled") {
      const reservedSeats = await getReservedSeats(
        updatedRestaurantId,
        updatedDate,
        updatedTime,
      );

      const seatsAfterUpdate = reservedSeats - reservation.partySize + Number(updatedPartySize);
      if (seatsAfterUpdate > restaurant.capacity) {
        return res.status(400).json({
          success: false,
          message: "Not enough seats available for the requested time",
        });
      }
    }

    const oldRestaurantId = reservation.restaurantId.toString();
    const oldDate = reservation.date.toISOString().split("T")[0];

    reservation.restaurantId = updatedRestaurantId;
    reservation.restaurantImage = restaurant.image || "";
    reservation.date = updatedDate;
    reservation.time = updatedTime;
    reservation.partySize = updatedPartySize;
    if (status) {
      reservation.status = status;
    }
    await reservation.save();

    // Broadcast availability updates for both old and new slots
    if (io) {
      broadcastAvailabilityUpdate(io, oldRestaurantId, oldDate);
      broadcastAvailabilityUpdate(
        io,
        updatedRestaurantId.toString(),
        updatedDate.toISOString().split("T")[0],
      );
    }

    res.status(200).json({
      success: true,
      message: "Reservation updated successfully",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const io = req.app.get("io");

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    if (reservation.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this reservation",
      });
    }

    const restaurantId = reservation.restaurantId.toString();
    const date = reservation.date.toISOString().split("T")[0];

    reservation.status = "cancelled";
    await reservation.save();

    // Broadcast availability update
    if (io) {
      broadcastAvailabilityUpdate(io, restaurantId, date);
    }

    res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getRestaurantAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "date query parameter is required",
      });
    }

    const reservationDate = parseDate(date);
    if (!reservationDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found or inactive",
      });
    }

    const reservations = await Reservation.find({
      restaurantId: id,
      date: reservationDate,
      status: "reserved",
    });

    const reservedByTime = reservations.reduce((acc, reservation) => {
      const key = reservation.time;
      acc[key] = (acc[key] || 0) + reservation.partySize;
      return acc;
    }, {});

    const totalReserved = reservations.reduce(
      (sum, reservation) => sum + reservation.partySize,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        restaurantId: restaurant._id,
        date: date,
        capacity: restaurant.capacity,
        reservedSeats: totalReserved,
        availableSeats: Math.max(0, restaurant.capacity - totalReserved),
        reservedByTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
