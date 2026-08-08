/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { RestaurantCard } from "../components/RestaurantCard";
import { api } from "../api";
import {
  AMBIANCE_OPTIONS,
  DIETARY_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SPECIAL_FEATURES,
} from "../constants/restaurantFilters";
import {
  countActiveFilters,
  filterRestaurants,
  normalizePriceRange,
} from "../utils/restaurantSearch";
import {
  Utensils,
  Search,
  Sparkles,
  Star,
  ShieldCheck,
  SlidersHorizontal,
  X,
  MapPin,
  Leaf,
  Music,
  Sun,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const FilterChip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
      active
        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
    }`}
  >
    {label}
  </button>
);

const FilterSection = ({ title, icon: Icon, options, selected, onToggle }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      {Icon ? <Icon size={14} className="text-indigo-600" /> : null}
      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
        {title}
      </h4>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <FilterChip
          key={option}
          label={option}
          active={selected.includes(option)}
          onClick={() => onToggle(option)}
        />
      ))}
    </div>
  </div>
);

export const Home = () => {
  const { restaurants, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [ratingMin, setRatingMin] = useState(0);
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [selectedAmbiance, setSelectedAmbiance] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterMeta, setFilterMeta] = useState(null);
  const [serverResults, setServerResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.getRestaurantFilters().then(setFilterMeta).catch(() => {});
  }, []);

  const cuisinesList = useMemo(() => {
    const fromApi = filterMeta?.cuisines || [];
    const fromData = new Set();
    restaurants.forEach((r) => {
      if (Array.isArray(r.cuisineType)) {
        r.cuisineType.forEach((cuisine) => fromData.add(cuisine));
      }
    });
    return ["All", ...Array.from(new Set([...fromApi, ...fromData])).sort()];
  }, [restaurants, filterMeta]);

  const locationsList = useMemo(() => {
    const fromApi = filterMeta?.cities || [];
    const fromData = new Set();
    restaurants.forEach((r) => {
      if (r.city) fromData.add(r.city);
    });
    return ["All", ...Array.from(new Set([...fromApi, ...fromData])).sort()];
  }, [restaurants, filterMeta]);

  const activeFilterCount = countActiveFilters({
    searchQuery,
    cuisine: selectedCuisine,
    city: selectedLocation,
    priceRange: selectedPrice,
    ratingMin,
    dietary: selectedDietary,
    ambiance: selectedAmbiance,
    features: selectedFeatures,
  });

  const filterParams = useMemo(
    () => ({
      searchQuery,
      cuisine: selectedCuisine,
      city: selectedLocation,
      priceRange: selectedPrice,
      ratingMin,
      dietary: selectedDietary,
      ambiance: selectedAmbiance,
      features: selectedFeatures,
    }),
    [
      searchQuery,
      selectedCuisine,
      selectedLocation,
      selectedPrice,
      ratingMin,
      selectedDietary,
      selectedAmbiance,
      selectedFeatures,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      if (activeFilterCount === 0) {
        setServerResults(null);
        return;
      }

      setSearching(true);
      try {
        const results = await api.searchRestaurants({
          search: searchQuery || undefined,
          city: selectedLocation,
          cuisineType:
            selectedCuisine !== "All" ? selectedCuisine : undefined,
          priceRange: selectedPrice !== "All" ? selectedPrice : undefined,
          ratingMin: ratingMin > 0 ? ratingMin : undefined,
          dietary: selectedDietary,
          ambiance: selectedAmbiance,
          features: selectedFeatures,
          limit: 100,
        });
        if (!cancelled) setServerResults(results);
      } catch (err) {
        console.error(err);
        if (!cancelled) setServerResults(null);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };

    const timer = window.setTimeout(runSearch, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    activeFilterCount,
    searchQuery,
    selectedLocation,
    selectedCuisine,
    selectedPrice,
    ratingMin,
    selectedDietary,
    selectedAmbiance,
    selectedFeatures,
  ]);

  const filteredRestaurants = useMemo(() => {
    const source =
      serverResults && activeFilterCount > 0 ? serverResults : restaurants;
    return filterRestaurants(source, filterParams);
  }, [
    restaurants,
    serverResults,
    activeFilterCount,
    filterParams,
  ]);

  const toggleSelection = (value, selected, setter) => {
    setter(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCuisine("All");
    setSelectedLocation("All");
    setSelectedPrice("All");
    setRatingMin(0);
    setSelectedDietary([]);
    setSelectedAmbiance([]);
    setSelectedFeatures([]);
    setServerResults(null);
  };

  const avgRating = useMemo(() => {
    if (!filteredRestaurants.length) return "0.0";
    const total = filteredRestaurants.reduce(
      (sum, r) => sum + Number(r.rating || 0),
      0,
    );
    return (total / filteredRestaurants.length).toFixed(1);
  }, [filteredRestaurants]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  const listLoading = isLoading || searching;

  return (
    <div className="min-h-screen bg-slate-50 pb-20" id="home-view-container">
      <section
        className="relative overflow-hidden bg-slate-950 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8"
        id="home-hero"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-indigo-900/30 border border-indigo-805/30 px-3.5 py-1.5 rounded-full mb-6 font-mono text-[11px] text-indigo-400 uppercase tracking-widest font-bold shadow-sm"
          >
            <Sparkles size={11} className="text-indigo-400 animate-pulse" />
            <span>DineFlow Discovery Engine</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-5"
          >
            Find Your Perfect Table
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-semibold"
          >
            Search by cuisine, city, price, dietary needs, ambiance, and special
            features like outdoor seating or live music.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-slate-900/80 border border-slate-800 backdrop-blur-md p-3.5 rounded-3xl max-w-4xl mx-auto shadow-2xl text-left"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col lg:flex-row items-stretch gap-2.5">
                <div className="flex-1 relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search restaurants, cuisines, neighborhoods..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-505 text-white placeholder:text-slate-500 font-medium transition-all"
                    id="search-input"
                  />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="bg-slate-950/60 border border-slate-850 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-505 cursor-pointer"
                    title="Filter by city"
                    id="location-filter-select"
                  >
                    <option value="All">All Locations</option>
                    {locationsList
                      .filter((l) => l !== "All")
                      .map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                  </select>

                  <select
                    value={selectedCuisine}
                    onChange={(e) => setSelectedCuisine(e.target.value)}
                    className="bg-slate-950/60 border border-slate-850 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-505 cursor-pointer"
                    title="Filter by cuisine"
                    id="cuisine-filter-select"
                  >
                    <option value="All">All Cuisines</option>
                    {cuisinesList
                      .filter((c) => c !== "All")
                      .map((cuisine) => (
                        <option key={cuisine} value={cuisine}>
                          {cuisine}
                        </option>
                      ))}
                  </select>

                  <select
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    className="bg-slate-950/60 border border-slate-850 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-505 cursor-pointer col-span-2 lg:col-span-1"
                    title="Filter by price range"
                    id="price-filter-select"
                  >
                    <option value="All">All Price Tiers</option>
                    {PRICE_RANGE_OPTIONS.map((tier) => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-200 hover:border-indigo-500 hover:text-white transition cursor-pointer"
                  id="advanced-filters-toggle"
                >
                  <SlidersHorizontal size={14} />
                  Advanced filters
                  {activeFilterCount > 0 ? (
                    <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>

                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                    id="reset-filters-btn"
                  >
                    <X size={14} />
                    Clear all filters
                  </button>
                ) : null}
              </div>

              <AnimatePresence>
                {showAdvancedFilters ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-800 pt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                            Minimum rating
                          </h4>
                          <span className="text-xs font-bold text-indigo-300">
                            {ratingMin > 0 ? `${ratingMin}+ stars` : "Any"}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={ratingMin}
                          onChange={(e) => setRatingMin(Number(e.target.value))}
                          className="w-full accent-indigo-500"
                          id="rating-min-slider"
                        />
                      </div>

                      <FilterSection
                        title="Dietary & restrictions"
                        icon={Leaf}
                        options={filterMeta?.dietaryOptions || DIETARY_OPTIONS}
                        selected={selectedDietary}
                        onToggle={(value) =>
                          toggleSelection(value, selectedDietary, setSelectedDietary)
                        }
                      />

                      <FilterSection
                        title="Ambiance"
                        icon={Music}
                        options={filterMeta?.ambianceOptions || AMBIANCE_OPTIONS}
                        selected={selectedAmbiance}
                        onToggle={(value) =>
                          toggleSelection(value, selectedAmbiance, setSelectedAmbiance)
                        }
                      />

                      <FilterSection
                        title="Special features"
                        icon={Sun}
                        options={filterMeta?.specialFeatures || SPECIAL_FEATURES}
                        selected={selectedFeatures}
                        onToggle={(value) =>
                          toggleSelection(value, selectedFeatures, setSelectedFeatures)
                        }
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        className="-mt-10 max-w-5xl mx-auto px-4 relative z-20"
        id="platform-stats-deck"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Utensils size={18} />
            </div>
            <div>
              <span className="block font-extrabold text-lg text-slate-900 leading-none">
                {filteredRestaurants.length} Match
                {filteredRestaurants.length === 1 ? "" : "es"}
              </span>
              <span className="text-[11px] text-slate-505 font-semibold mt-1 block">
                From {restaurants.length} partner restaurants
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Star className="fill-indigo-305 text-indigo-600" size={18} />
            </div>
            <div>
              <span className="block font-extrabold text-lg text-slate-900 leading-none">
                {avgRating} Avg Rating
              </span>
              <span className="text-[11px] text-slate-505 font-semibold mt-1 block">
                Across current search results
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
              <ShieldCheck className="text-emerald-600" size={18} />
            </div>
            <div>
              <span className="block font-extrabold text-lg text-slate-900 leading-none">
                Smart Filters
              </span>
              <span className="text-[11px] text-slate-505 font-semibold mt-1 block">
                Dietary, ambiance & features
              </span>
            </div>
          </div>
        </div>
      </section>

      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16"
        id="listings-main"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Vetted Restaurants
            </h2>
            <p className="text-slate-505 text-xs mt-0.5 font-semibold flex items-center gap-1.5">
              <MapPin size={12} />
              {selectedLocation === "All"
                ? "All cities"
                : selectedLocation}
              {selectedCuisine !== "All" ? ` · ${selectedCuisine}` : ""}
              {selectedPrice !== "All" ? ` · ${selectedPrice}` : ""}
            </p>
          </div>

          <div
            className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1"
            id="cuisine-pills"
          >
            {cuisinesList.slice(0, 8).map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`text-sm font-semibold px-5 py-2.5 rounded-2xl border transition-all cursor-pointer whitespace-nowrap ${
                  selectedCuisine === cuisine
                    ? "bg-slate-900 border-slate-900 text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-xs"
                }`}
                id={`cuisine-pill-${cuisine}`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {listLoading ? (
          <div
            className="flex flex-col items-center justify-center h-80 text-center"
            id="search-spinner-loader"
          >
            <div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-500 text-sm font-semibold">
              Searching restaurants...
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredRestaurants.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                id="restaurant-cards-grid"
              >
                {filteredRestaurants.map((rest) => (
                  <motion.div
                    key={rest._id || rest.id}
                    variants={itemVariants}
                    layout
                  >
                    <RestaurantCard restaurant={rest} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"
                id="empty-search-results"
              >
                <Search size={32} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  No restaurants match your filters
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  Try broadening your search, choosing another cuisine or city,
                  or removing advanced filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                  id="empty-reset-filters-btn"
                >
                  Reset all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};
