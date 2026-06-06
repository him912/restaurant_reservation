const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createReservation,
  getMyReservations,
  updateReservation,
  deleteReservation,
} = require("../controllers/reservationController");

router.post("/", protect, createReservation);
router.get("/my", protect, getMyReservations);
router.put("/:id", protect, updateReservation);
router.delete("/:id", protect, deleteReservation);

module.exports = router;
