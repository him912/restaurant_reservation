const DIETARY_OPTIONS = [
  "Gluten-Free Menu Options",
  "Vegan-Only Cooking Stations",
  "100% Organic Ingredients",
  "Vegetarian Friendly",
  "Halal Options",
  "Nut-Free Kitchen",
];

const AMBIANCE_OPTIONS = [
  "Romantic Dinner Settings",
  "Intimate Minimalist Vibe",
  "Live Music",
  "Live French Jazz Fri",
  "Family Friendly",
  "Fine Dining",
  "Casual Dining",
  "Rooftop Views",
];

const SPECIAL_FEATURES = [
  "Outdoor Seating",
  "Private Dining Rooms",
  "Valet Parking Available",
  "Chef Table Only",
  "Pet Friendly Patio",
  "Wheelchair Accessible",
  "Free Wi-Fi",
  "Bar & Lounge",
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

module.exports = {
  DIETARY_OPTIONS,
  AMBIANCE_OPTIONS,
  SPECIAL_FEATURES,
  PRICE_RANGES,
  parseCsv,
};
