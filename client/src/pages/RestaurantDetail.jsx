import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getApi, getAuthApi } from "../utils/api";
import ReviewList from "../components/ReviewList";
import ReservationForm from "../components/ReservationForm";

function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [restaurantRes, reviewsRes] = await Promise.all([
          getApi().get(`/restaurants/${id}`),
          getApi().get(`/reviews/restaurant/${id}`),
        ]);
        setRestaurant(restaurantRes.data.data);
        setReviews(reviewsRes.data.data);
      } catch (err) {
        setMessage("Unable to load restaurant details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const refreshAvailability = async (date) => {
    try {
      const response = await getApi().get(`/restaurants/${id}/availability`, {
        params: { date },
      });
      setAvailability(response.data.data);
    } catch (err) {
      setAvailability(null);
    }
  };

  const handleReservationSuccess = () => {
    setMessage("Reservation created successfully. Check your profile for details.");
  };

  return (
    <div className="page detail-page">
      {loading ? (
        <p>Loading...</p>
      ) : restaurant ? (
        <>
          <section className="restaurant-hero">
            <div>
              <h1>{restaurant.name}</h1>
              <p>{restaurant.description}</p>
              <div className="restaurant-meta">
                <span>{restaurant.city}</span>
                <span>{restaurant.priceRange}</span>
                <span>{restaurant.rating?.toFixed(1) || "-"} ★</span>
              </div>
            </div>
            {restaurant.restaurantImage && (
              <img src={restaurant.restaurantImage} alt={restaurant.name} />
            )}
          </section>

          <section className="menu-gallery">
            <div className="menu-block">
              <h2>Menu</h2>
              {restaurant.menuItems?.length ? (
                <ul>
                  {restaurant.menuItems.map((item) => (
                    <li key={item._id}>
                      <strong>{item.name}</strong> — {item.category || "General"}
                      <span>{item.price ? `₹${item.price}` : "Price not set"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No menu items available yet.</p>
              )}
            </div>
            {restaurant.gallery?.length > 0 && (
              <div className="gallery-block">
                <h2>Gallery</h2>
                <div className="gallery-grid">
                  {restaurant.gallery.map((url, index) => (
                    <img key={index} src={url} alt={`${restaurant.name} ${index + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="reservation-panel">
            <ReservationForm
              restaurantId={id}
              restaurantName={restaurant.name}
              onSuccess={handleReservationSuccess}
              onAvailability={refreshAvailability}
            />
            {availability && (
              <div className="availability-box">
                <h3>Availability for {availability.date}</h3>
                <p>
                  {availability.availableSeats} seats available of {availability.capacity}
                </p>
                <pre>{JSON.stringify(availability.reservedByTime, null, 2)}</pre>
              </div>
            )}
          </section>

          <section className="reviews-section">
            <ReviewList reviews={reviews} />
          </section>
        </>
      ) : (
        <p>{message || "Restaurant not found."}</p>
      )}
    </div>
  );
}

export default RestaurantDetail;
