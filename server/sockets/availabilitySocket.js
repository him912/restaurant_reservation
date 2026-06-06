const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");

const setupAvailabilitySocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("subscribe_availability", async (data) => {
      const { restaurantId, date } = data;

      if (!restaurantId || !date) {
        socket.emit("error", {
          message: "restaurantId and date are required",
        });
        return;
      }

      const room = `availability_${restaurantId}_${date}`;
      socket.join(room);

      try {
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || !restaurant.isActive) {
          socket.emit("error", {
            message: "Restaurant not found or inactive",
          });
          return;
        }

        const reservations = await Reservation.find({
          restaurantId,
          date: new Date(date),
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

        socket.emit("availability_update", {
          restaurantId,
          date,
          capacity: restaurant.capacity,
          reservedSeats: totalReserved,
          availableSeats: Math.max(0, restaurant.capacity - totalReserved),
          reservedByTime,
        });
      } catch (error) {
        socket.emit("error", {
          message: error.message,
        });
      }
    });

    socket.on("unsubscribe_availability", (data) => {
      const { restaurantId, date } = data;
      const room = `availability_${restaurantId}_${date}`;
      socket.leave(room);
    });

    socket.on("disconnect", () => {
      socket.disconnect();
    });
  });
};

const broadcastAvailabilityUpdate = async (io, restaurantId, date) => {
  const room = `availability_${restaurantId}_${date}`;

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return;

    const reservations = await Reservation.find({
      restaurantId,
      date: new Date(date),
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

    io.to(room).emit("availability_update", {
      restaurantId,
      date,
      capacity: restaurant.capacity,
      reservedSeats: totalReserved,
      availableSeats: Math.max(0, restaurant.capacity - totalReserved),
      reservedByTime,
    });
  } catch (error) {
    io.to(room).emit("error", {
      message: error.message,
    });
  }
};

module.exports = { setupAvailabilitySocket, broadcastAvailabilityUpdate };
