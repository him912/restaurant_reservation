/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RestaurantCard } from '../components/RestaurantCard';
import { Utensils, Search, MapPin, DollarSign, Sparkles, Star, CalendarDays, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Home = () => {
  const { restaurants, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');

  // Gather unique cuisines & locations for filter dropdowns automatically
  const cuisinesList = useMemo(() => {
    const list = new Set();
    restaurants.forEach(r => list.add(r.cuisine.split(' / ')[0])); // Simple match split
    return ['All', ...Array.from(list)];
  }, [restaurants]);

  const locationsList = useMemo(() => {
    const list = new Set();
    restaurants.forEach(r => list.add(r.location));
    return ['All', ...Array.from(list)];
  }, [restaurants]);

  const priceTiers = ['All', '§', '§§', '§§§', '§§§§'];

  // Stagger animation rules
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  // Filter listings based on input criteria
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCuisine =
        selectedCuisine === 'All' ||
        r.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());

      const matchLocation = selectedLocation === 'All' || r.location === selectedLocation;

      const matchPrice = selectedPrice === 'All' || r.priceRange === selectedPrice;

      return matchSearch && matchCuisine && matchLocation && matchPrice;
    });
  }, [restaurants, searchQuery, selectedCuisine, selectedLocation, selectedPrice]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20" id="home-view-container">
      {/* 1. Ultra-Premium Brand Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8" id="home-hero">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-indigo-900/30 border border-indigo-805/30 px-3.5 py-1.5 rounded-full mb-6 font-mono text-[11px] text-indigo-400 uppercase tracking-widest font-bold shadow-sm"
          >
            <Sparkles size={11} className="text-indigo-400 animate-pulse" />
            <span>Guaranteed Premium Partner Tables</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight font-sans text-slate-100"
          >
            Savor the Moment. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-305 to-pink-300">
              Skip the Waiting Line.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-semibold font-sans"
          >
            Book table seating at premier rated local hotspots and publish review ratings directly on our connected platform.
          </motion.p>

          {/* Search Workspace Input console */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-slate-900/80 border border-slate-800 backdrop-blur-md p-3.5 rounded-3xl max-w-3xl mx-auto shadow-2xl"
          >
            <div className="flex flex-col md:flex-row items-stretch gap-2.5">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Craving Italian, Sushi, Steaks, or Bistro dining? Type here..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-505 text-white placeholder:text-slate-500 font-medium transition-all"
                  id="search-input"
                />
              </div>

              {/* Instant Controls */}
              <div className="flex gap-2">
                <select
                  value={selectedLocation}
                  onChange={e => setSelectedLocation(e.target.value)}
                  className="bg-slate-950/60 border border-slate-850 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-505 min-w-[120px] cursor-pointer"
                  title="Filter Location Area"
                  id="location-filter-select"
                >
                  <option value="All">All Locations</option>
                  {locationsList.filter(l => l !== 'All').map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>

                <select
                  value={selectedPrice}
                  onChange={e => setSelectedPrice(e.target.value)}
                  className="bg-slate-950/60 border border-slate-850 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-505 min-w-[100px] cursor-pointer"
                  title="Filter Price Tier"
                  id="price-filter-select"
                >
                  <option value="All">All Price Tiers</option>
                  {priceTiers.filter(p => p !== 'All').map(pr => (
                    <option key={pr} value={pr}>{pr === '§' ? '$' : pr === '§§' ? '$$' : pr === '§§§' ? '$$$' : '$$$$'}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Sleek Visual Platform Metrics Bar */}
      <section className="-mt-10 max-w-5xl mx-auto px-4 relative z-20" id="platform-stats-deck">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Utensils size={18} />
            </div>
            <div>
              <span className="block font-extrabold text-lg text-slate-900 leading-none">6 Partner Spots</span>
              <span className="text-[11px] text-slate-505 font-semibold mt-1 block">Finely curated cuisines</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Star className="fill-indigo-305 text-indigo-600" size={18} />
            </div>
            <div>
              <span className="block font-extrabold text-lg text-slate-900 leading-none">4.8 Avg Star Rating</span>
              <span className="text-[11px] text-slate-505 font-semibold mt-1 block">Over 800+ consumer feedback reviews</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
              <ShieldCheck className="text-emerald-600" size={18} />
            </div>
            <div>
              <span className="block font-extrabold text-lg text-slate-900 leading-none">100% Reliable</span>
              <span className="text-[11px] text-slate-505 font-semibold mt-1 block">Automatic check-in confirmed tickets</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Restaurant Listings Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16" id="listings-main">
        {/* Section title & Category filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vetted Restaurants</h2>
            <p className="text-slate-505 text-xs mt-0.5 font-semibold">Choose from the finest culinary destinations</p>
          </div>

          {/* Quick pills categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 pointer-smooth scrollbar-none" id="cuisine-pills">
            {cuisinesList.map(cuisine => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`text-sm font-semibold px-5 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedCuisine === cuisine
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-xs'
                }`}
                id={`cuisine-pill-${cuisine}`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Items loading/result block */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80 text-center" id="search-spinner-loader">
            <div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-500 text-sm font-semibold">Updating curated listings catalog...</p>
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
                {filteredRestaurants.map(rest => (
                  <motion.div key={rest.id} variants={itemVariants} className="h-full">
                    <RestaurantCard restaurant={rest} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-dashed border-zinc-300 p-12 text-center rounded-2xl max-w-md mx-auto mt-12"
                id="no-results-panel"
              >
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-4">
                  <Search size={22} />
                </div>
                <h4 className="text-zinc-900 font-bold mb-1">No matching restaurants found</h4>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto mb-6">
                  Try broadening your keyword search, selecting another cuisine category, or clearing filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCuisine('All');
                    setSelectedLocation('All');
                    setSelectedPrice('All');
                  }}
                  className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition shadow-sm active:scale-97 cursor-pointer"
                  id="reset-filters-btn"
                >
                  Reset All Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};
