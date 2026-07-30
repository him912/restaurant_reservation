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
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "https://restaurant-reservation-sandy-three.vercel.app",
  "https://sweet-centaur-8df9e0.netlify.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser / same-origin requests (no Origin header)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any vercel.app / netlify.app preview deploy
    if (
      /\.vercel\.app$/.test(origin) ||
      /\.netlify\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true); // keep permissive for API clients
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

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
