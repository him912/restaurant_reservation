const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { setupAvailabilitySocket } = require("./sockets/availabilitySocket");

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000",
      "https://sweet-centaur-8df9e0.netlify.app"
    ],
    credentials: true,
  },
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "https://sweet-centaur-8df9e0.netlify.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());
app.use(express.json());

// Attach io to app for use in controllers
app.set("io", io);

//Routes
app.use("/api/", require("./routes/authRoutes"));
app.use("/api/restaurants", require("./routes/restaurantRoute"));
app.use("/api/reservations", require("./routes/reservationRoute"));
app.use("/api/reviews", require("./routes/reviewRoute"));
app.use("/api/upload", require("./routes/uploadRoute"));
app.use("/api/admin", require("./routes/adminRoute"));

// Setup Socket.io handlers
setupAvailabilitySocket(io);

app.get("/", (req, res) => {
  res.send("Auth API Running");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
