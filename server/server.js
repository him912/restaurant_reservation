const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

//Routes
app.use("/api/", require("./routes/authRoutes"));

app.use("/api/restaurants", require("./routes/restaurantRoute"));

app.get("/", (req, res) => {
  res.send("Auth API Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
