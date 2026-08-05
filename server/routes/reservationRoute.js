const express = require("express");
const router = express.Router();
const { protect, ownerOnly } = require("../middleware/authMiddleware");
const {
  createReservation,
  getMyReservations,
  getOwnerReservations,
  updateReservation,
  updateOwnerReservationStatus,
  deleteReservation,
} = require("../controllers/reservationController");

router.post("/", protect, createReservation);
router.get("/my", protect, getMyReservations);
router.get("/owner", protect, ownerOnly, getOwnerReservations);
router.put("/:id/owner-status", protect, ownerOnly, updateOwnerReservationStatus);
router.put("/:id", protect, updateReservation);
router.delete("/:id", protect, deleteReservation);

module.exports = router;
