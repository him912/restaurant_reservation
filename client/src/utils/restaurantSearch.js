export const normalizePriceRange = (value) => {
  if (!value) return "";
  const map = { "§": "$", "§§": "$$", "§§§": "$$$", "§§§§": "$$$$" };
  return map[value] || value;
};

export const restaurantHasFeature = (restaurant, needle) => {
  const features = Array.isArray(restaurant?.features) ? restaurant.features : [];
  const query = String(needle || "").toLowerCase();
  if (!query) return true;

  return features.some((feature) => {
    const value = String(feature || "").toLowerCase();
    return value.includes(query) || query.includes(value);
  });
};

export const matchesAllFeatures = (restaurant, selected = []) => {
  if (!selected.length) return true;
  return selected.every((item) => restaurantHasFeature(restaurant, item));
};

export const filterRestaurants = (restaurants, filters) => {
  const {
    searchQuery = "",
    cuisine = "All",
    city = "All",
    priceRange = "All",
    ratingMin = 0,
    dietary = [],
    ambiance = [],
    features = [],
  } = filters;

  const query = searchQuery.trim().toLowerCase();

  return restaurants.filter((restaurant) => {
    const cuisines = Array.isArray(restaurant.cuisineType)
      ? restaurant.cuisineType
      : restaurant.cuisine
        ? [restaurant.cuisine]
        : [];

    const matchSearch =
      !query ||
      String(restaurant.name || "").toLowerCase().includes(query) ||
      String(restaurant.description || "").toLowerCase().includes(query) ||
      String(restaurant.city || "").toLowerCase().includes(query) ||
      String(restaurant.address || "").toLowerCase().includes(query) ||
      cuisines.some((item) => String(item).toLowerCase().includes(query));

    const matchCuisine =
      cuisine === "All" ||
      cuisines.some(
        (item) => String(item).toLowerCase() === String(cuisine).toLowerCase(),
      );

    const matchCity =
      city === "All" ||
      String(restaurant.city || "").toLowerCase() === String(city).toLowerCase();

    const normalizedPrice = normalizePriceRange(restaurant.priceRange);
    const matchPrice =
      priceRange === "All" || normalizedPrice === priceRange;

    const matchRating = Number(restaurant.rating || 0) >= Number(ratingMin || 0);

    const matchDietary = matchesAllFeatures(restaurant, dietary);
    const matchAmbiance = matchesAllFeatures(restaurant, ambiance);
    const matchFeatures = matchesAllFeatures(restaurant, features);

    return (
      matchSearch &&
      matchCuisine &&
      matchCity &&
      matchPrice &&
      matchRating &&
      matchDietary &&
      matchAmbiance &&
      matchFeatures
    );
  });
};

export const countActiveFilters = (filters) => {
  let count = 0;
  if (filters.searchQuery?.trim()) count += 1;
  if (filters.cuisine && filters.cuisine !== "All") count += 1;
  if (filters.city && filters.city !== "All") count += 1;
  if (filters.priceRange && filters.priceRange !== "All") count += 1;
  if (Number(filters.ratingMin) > 0) count += 1;
  count += (filters.dietary || []).length;
  count += (filters.ambiance || []).length;
  count += (filters.features || []).length;
  return count;
};
