import { Link } from "react-router-dom";

function RestaurantCard({ restaurant }) {
  return (
    <article className="restaurant-card">
      {restaurant.restaurantImage && (
        <img src={restaurant.restaurantImage} alt={restaurant.name} />
      )}
      <div className="card-content">
        <h3>{restaurant.name}</h3>
        <p>{restaurant.description}</p>
        <div className="card-meta">
          <span>{restaurant.city}</span>
          <span>{restaurant.priceRange}</span>
          <span>{restaurant.rating?.toFixed(1) || "-"} ★</span>
        </div>
        <div className="card-tags">
          {restaurant.cuisineType?.slice(0, 3).map((cuisine) => (
            <small key={cuisine}>{cuisine}</small>
          ))}
        </div>
        <Link to={`/restaurant/${restaurant._id}`} className="card-link">
          View details
        </Link>
      </div>
    </article>
  );
}

export default RestaurantCard;
