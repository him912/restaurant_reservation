import { useEffect, useMemo, useState } from "react";
import { getApi } from "../utils/api";
import RestaurantCard from "../components/RestaurantCard";

const DEFAULT_FILTERS = {
  search: "",
  city: "",
  cuisineType: "",
  priceRange: "",
};

function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [options, setOptions] = useState({ cities: [], cuisines: [], priceRanges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.city) params.set("city", filters.city);
    if (filters.cuisineType) params.set("cuisineType", filters.cuisineType);
    if (filters.priceRange) params.set("priceRange", filters.priceRange);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await getApi().get("/restaurants/filters");
        setOptions(response.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getApi().get(`/restaurants?${query}`);
        setRestaurants(response.data.data);
      } catch (err) {
        setError("Unable to load restaurants.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [query]);

  return (
    <div className="page home-page">
      <section className="hero">
        <div>
          <h1>Book your next dining experience</h1>
          <p>Search restaurants, check availability, and read real guest reviews.</p>
        </div>
      </section>

      <section className="filters-panel">
        <div className="filter-group">
          <input
            type="search"
            aria-label="Search restaurants"
            placeholder="Search by name, cuisine, or location"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <div className="filter-row">
          <select
            value={filters.city}
            onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
          >
            <option value="">All cities</option>
            {options.cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <select
            value={filters.cuisineType}
            onChange={(e) => setFilters((prev) => ({ ...prev, cuisineType: e.target.value }))}
          >
            <option value="">All cuisines</option>
            {options.cuisines.map((cuisine) => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </select>
          <select
            value={filters.priceRange}
            onChange={(e) => setFilters((prev) => ({ ...prev, priceRange: e.target.value }))}
          >
            <option value="">All price ranges</option>
            {options.priceRanges.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="restaurant-grid">
        {loading && <p>Loading restaurants...</p>}
        {!loading && restaurants.length === 0 && <p>No restaurants match your search.</p>}
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant._id} restaurant={restaurant} />
        ))}
      </section>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Home;
