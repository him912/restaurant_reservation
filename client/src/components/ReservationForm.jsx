import { useState } from "react";
import { getAuthApi, getApi } from "../utils/api";
import { getToken } from "../utils/auth";

function ReservationForm({ restaurantId, restaurantName, onSuccess, onAvailability }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [partySize, setPartySize] = useState(2);
  const [status, setStatus] = useState("");

  const handleAvailability = async () => {
    if (!date) return;
    await onAvailability(date);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");

    if (!getToken()) {
      setStatus("Please login to reserve a table.");
      return;
    }

    try {
      await getAuthApi().post("/reservations", {
        restaurantId,
        date,
        time,
        partySize,
      });
      setStatus("Reservation confirmed. Check your profile for details.");
      onSuccess();
    } catch (err) {
      setStatus(err?.response?.data?.message || "Unable to create reservation.");
    }
  };

  return (
    <div className="reservation-card">
      <h2>Reserve a table</h2>
      <p>{restaurantName}</p>
      <form onSubmit={handleSubmit}>
        <label>
          Date
          <input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Time
          <input
            type="time"
            value={time}
            required
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label>
          Party size
          <input
            type="number"
            min="1"
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
          />
        </label>
        <div className="form-actions">
          <button type="button" onClick={handleAvailability}>Check availability</button>
          <button type="submit">Book now</button>
        </div>
        {status && <p className="status-message">{status}</p>}
      </form>
    </div>
  );
}

export default ReservationForm;
