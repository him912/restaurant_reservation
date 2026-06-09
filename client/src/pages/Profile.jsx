import { useEffect, useState } from "react";
import { getAuthApi } from "../utils/api";
import { getToken } from "../utils/auth";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [reservations, setReservations] = useState([]);
  const [reservationsMessage, setReservationsMessage] = useState("");
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ date: "", time: "", partySize: 1 });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getAuthApi().get("/users");
        setProfile(response.data.data);
      } catch (err) {
        setMessage("Unable to fetch profile. Please login.");
      }
    };

    if (getToken()) {
      fetchProfile();
    } else {
      setMessage("Please login to view your profile.");
    }
  }, []);

  const fetchReservations = async () => {
    if (!getToken()) {
      setReservationsMessage("Please login to view your reservations.");
      return;
    }

    setLoadingReservations(true);
    setReservationsMessage("");

    try {
      const response = await getAuthApi().get("/reservations/my");
      setReservations(response.data.data);
      if (response.data.data.length === 0) {
        setReservationsMessage("You have no upcoming reservations.");
      }
    } catch (err) {
      setReservationsMessage(err?.response?.data?.message || "Unable to load your reservations.");
    } finally {
      setLoadingReservations(false);
    }
  };

  const startEditing = (reservation) => {
    setEditingId(reservation._id);
    setEditValues({
      date: reservation.date?.slice(0, 10) || "",
      time: reservation.time || "19:00",
      partySize: reservation.partySize || 1,
    });
    setReservationsMessage("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ date: "", time: "", partySize: 1 });
  };

  const saveReservation = async (reservationId) => {
    try {
      const response = await getAuthApi().put(`/reservations/${reservationId}`, {
        date: editValues.date,
        time: editValues.time,
        partySize: Number(editValues.partySize),
      });

      setReservations((prev) =>
        prev.map((reservation) =>
          reservation._id === reservationId ? response.data.data : reservation,
        ),
      );
      setReservationsMessage("Reservation updated successfully.");
      cancelEditing();
    } catch (err) {
      setReservationsMessage(err?.response?.data?.message || "Unable to update reservation.");
    }
  };

  const deleteReservation = async (reservationId) => {
    const confirmed = window.confirm("Delete this reservation?");
    if (!confirmed) return;

    try {
      await getAuthApi().delete(`/reservations/${reservationId}`);
      setReservations((prev) => prev.filter((reservation) => reservation._id !== reservationId));
      setReservationsMessage("Reservation deleted successfully.");
      if (editingId === reservationId) {
        cancelEditing();
      }
    } catch (err) {
      setReservationsMessage(err?.response?.data?.message || "Unable to delete reservation.");
    }
  };

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <h2>My Profile</h2>
        {message && <p className="error-message">{message}</p>}
        {profile && (
          <div className="profile-details">
            <p><strong>Name:</strong> {profile.username}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Favorite cuisines:</strong> {profile.favoriteCuisines?.join(", ") || "None"}</p>
            <p><strong>Dietary preferences:</strong> {profile.dietaryPreferences?.join(", ") || "None"}</p>
          </div>
        )}
      </div>

      <div className="profile-card reservations-card">
        <div className="reservations-header">
          <h2>My Reservations</h2>
          <button type="button" onClick={fetchReservations} disabled={loadingReservations}>
            {reservations.length > 0 ? "Refresh" : "Load My Reservations"}
          </button>
        </div>

        {reservationsMessage && <p className="status-message">{reservationsMessage}</p>}
        {loadingReservations && <p>Loading reservations...</p>}

        {reservations.map((reservation) => {
          const restaurant = reservation.restaurantId || {};
          const isEditing = editingId === reservation._id;
          return (
            <div key={reservation._id} className="reservation-card profile-reservation-card">
              <div className="reservation-card-header">
                <div>
                  <h3>{restaurant.name || "Restaurant"}</h3>
                  <p>{restaurant.city}, {restaurant.address}</p>
                </div>
                <div className="reservation-card-actions">
                  <button className="icon-button" type="button" onClick={() => startEditing(reservation)}>
                    ✏️
                  </button>
                  <button className="icon-button delete-button" type="button" onClick={() => deleteReservation(reservation._id)}>
                    🗑️
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="reservation-edit-form">
                  <label>
                    Date
                    <input
                      type="date"
                      value={editValues.date}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </label>
                  <label>
                    Time
                    <input
                      type="time"
                      value={editValues.time}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, time: e.target.value }))}
                    />
                  </label>
                  <label>
                    Party size
                    <input
                      type="number"
                      min="1"
                      value={editValues.partySize}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, partySize: e.target.value }))}
                    />
                  </label>
                  <div className="form-actions">
                    <button type="button" onClick={() => saveReservation(reservation._id)}>
                      Save
                    </button>
                    <button type="button" onClick={cancelEditing}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="reservation-details">
                  <p><strong>Date:</strong> {reservation.date?.slice(0, 10)}</p>
                  <p><strong>Time:</strong> {reservation.time}</p>
                  <p><strong>Party size:</strong> {reservation.partySize}</p>
                  <p><strong>Status:</strong> {reservation.status}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Profile;
