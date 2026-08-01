/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { RatingStars } from "../components/RatingStars";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Star,
  Users,
  TrendingUp,
  Activity,
  Trash2,
  ChevronDown,
  Plus,
  X,
  Check,
  Clock,
  CalendarCheck2,
  MessageSquare,
  Send,
} from "lucide-react";
import { motion } from "motion/react";

export const AdminPanel = () => {
  const {
    restaurants,
    adminReservations,
    adminReviews,
    currentUser,
    toggleRestaurantVisibility,
    clearRestaurantReport,
    deleteRestaurant,
    showToast,
    fetchAdminRestaurantsByStatus,
    fetchAdminReservations,
    updateAdminReservationStatus,
    fetchAdminReviews,
    deleteAdminReview,
    replyAdminReview,
    createRestaurant,
    uploadRestaurantGallery,
    openAuthModal,
  } = useApp();
  const [activeTab, setActiveTab] = useState("restaurants");
  const [sortBy, setSortBy] = useState("name");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reservationFilterStatus, setReservationFilterStatus] = useState("all");
  const [reservationSearchQuery, setReservationSearchQuery] = useState("");
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState("all");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingToId, setReplyingToId] = useState(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Restaurant creation form state
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantDescription, setNewRestaurantDescription] = useState("");
  const [newRestaurantCuisine, setNewRestaurantCuisine] = useState("");
  const [newRestaurantAddress, setNewRestaurantAddress] = useState("");
  const [newRestaurantCity, setNewRestaurantCity] = useState("");
  const [newRestaurantPhone, setNewRestaurantPhone] = useState("");
  const [newRestaurantEmail, setNewRestaurantEmail] = useState("");
  const [newRestaurantWebsite, setNewRestaurantWebsite] = useState("");
  const [newRestaurantImage, setNewRestaurantImage] = useState("");
  const [newRestaurantImageFile, setNewRestaurantImageFile] = useState(null);
  const [newRestaurantCapacity, setNewRestaurantCapacity] = useState(20);
  const [newRestaurantOpeningTime, setNewRestaurantOpeningTime] = useState("09:00");
  const [newRestaurantClosingTime, setNewRestaurantClosingTime] = useState("22:00");
  const [newRestaurantPriceRange, setNewRestaurantPriceRange] = useState("$$");
  const [newRestaurantFeatures, setNewRestaurantFeatures] = useState([]);
  const [newRestaurantGalleryFiles, setNewRestaurantGalleryFiles] = useState([]);

  const isAdminAuthenticated =
    Boolean(localStorage.getItem("dineflow_token")) &&
    currentUser?.role === "admin";

  // Fetch restaurants when filter changes
  useEffect(() => {
    if (activeTab !== "restaurants" || !isAdminAuthenticated) return;

    const loadRestaurantsByStatus = async () => {
      try {
        let statusParam = null;
        if (filterStatus === "visible") {
          statusParam = "active";
        } else if (filterStatus === "hidden") {
          statusParam = "inactive";
        }
        await fetchAdminRestaurantsByStatus(statusParam);
      } catch (err) {
        console.error("Failed to load restaurants:", err);
      }
    };
    loadRestaurantsByStatus();
  }, [filterStatus, fetchAdminRestaurantsByStatus, activeTab, isAdminAuthenticated]);

  // Fetch reservations when tab or filter changes
  useEffect(() => {
    if (activeTab !== "reservations" || !isAdminAuthenticated) return;

    const loadReservations = async () => {
      try {
        const statusParam =
          reservationFilterStatus === "all" ? null : reservationFilterStatus;
        await fetchAdminReservations(statusParam);
      } catch (err) {
        console.error("Failed to load reservations:", err);
      }
    };
    loadReservations();
  }, [
    activeTab,
    reservationFilterStatus,
    fetchAdminReservations,
    isAdminAuthenticated,
  ]);

  // Fetch reviews when Reviews tab is active or rating filter changes
  useEffect(() => {
    if (activeTab !== "reviews" || !isAdminAuthenticated) return;

    const loadReviews = async () => {
      try {
        const filters = {};
        if (reviewRatingFilter !== "all") {
          filters.rating = reviewRatingFilter;
        }
        await fetchAdminReviews(filters);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    };
    loadReviews();
  }, [activeTab, reviewRatingFilter, fetchAdminReviews, isAdminAuthenticated]);

  // Filter and sort restaurants
  // API already filters by status, so we only need to filter for "reported" and search
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => {
        const matchesSearch =
          r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.city?.toLowerCase().includes(searchQuery.toLowerCase());
        
        // If filterStatus is "reported", filter for reported restaurants on client side
        if (filterStatus === "reported") {
          return matchesSearch && r.reported === true;
        }
        // Otherwise, API has already filtered by status, just apply search
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a.name || "").localeCompare(b.name || "");
        } else if (sortBy === "rating") {
          return (b.rating || 0) - (a.rating || 0);
        } else if (sortBy === "reviews") {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        return 0;
      });
  }, [restaurants, searchQuery, filterStatus, sortBy]);

  // Calculate statistics based on current filter
  const stats = useMemo(() => {
    let visibleCount = 0;
    let hiddenCount = 0;
    let reportedCount = 0;

    // Count based on current filter
    if (filterStatus === "all" || filterStatus === "reported") {
      visibleCount = restaurants.filter((r) => r.isActive !== false).length;
      hiddenCount = restaurants.filter((r) => r.isActive === false).length;
      reportedCount = restaurants.filter((r) => r.reported === true).length;
    } else if (filterStatus === "visible") {
      visibleCount = restaurants.length;
      reportedCount = restaurants.filter((r) => r.reported === true).length;
    } else if (filterStatus === "hidden") {
      hiddenCount = restaurants.length;
      reportedCount = restaurants.filter((r) => r.reported === true).length;
    }

    return {
      total: restaurants.length,
      visible: visibleCount,
      hidden: hiddenCount,
      reported: reportedCount,
      avgRating:
        restaurants.length > 0
          ? (
              restaurants.reduce((sum, r) => sum + (r.rating || 0), 0) /
              restaurants.length
            ).toFixed(1)
          : 0,
    };
  }, [restaurants, filterStatus]);

  const reservationStats = useMemo(() => {
    return {
      total: adminReservations.length,
      pending: adminReservations.filter((r) => r.status === "pending").length,
      confirmed: adminReservations.filter((r) => r.status === "confirmed").length,
      cancelled: adminReservations.filter((r) => r.status === "cancelled").length,
    };
  }, [adminReservations]);

  const filteredReservations = useMemo(() => {
    return adminReservations.filter((r) => {
      const query = reservationSearchQuery.toLowerCase();
      const matchesSearch =
        r.customerName?.toLowerCase().includes(query) ||
        r.customerEmail?.toLowerCase().includes(query) ||
        r.restaurantName?.toLowerCase().includes(query);

      if (reservationFilterStatus === "all") {
        return matchesSearch;
      }
      return matchesSearch && r.status === reservationFilterStatus;
    });
  }, [adminReservations, reservationSearchQuery, reservationFilterStatus]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAcceptReservation = async (reservationId) => {
    try {
      await updateAdminReservationStatus(reservationId, "confirmed");
    } catch (err) {
      console.error("Failed to accept reservation:", err);
    }
  };

  const handleRejectReservation = async (reservationId) => {
    try {
      if (window.confirm("Are you sure you want to reject this reservation?")) {
        await updateAdminReservationStatus(reservationId, "cancelled");
      }
    } catch (err) {
      console.error("Failed to reject reservation:", err);
    }
  };

  const reviewStats = useMemo(() => {
    return {
      total: adminReviews.length,
      withReplies: adminReviews.filter(
        (r) => Array.isArray(r.responses) && r.responses.length > 0,
      ).length,
      unanswered: adminReviews.filter(
        (r) => !Array.isArray(r.responses) || r.responses.length === 0,
      ).length,
      avgRating:
        adminReviews.length > 0
          ? (
              adminReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
              adminReviews.length
            ).toFixed(1)
          : "0",
    };
  }, [adminReviews]);

  const filteredReviews = useMemo(() => {
    const query = reviewSearchQuery.toLowerCase();
    return adminReviews.filter((r) => {
      return (
        r.reviewerName?.toLowerCase().includes(query) ||
        r.reviewerEmail?.toLowerCase().includes(query) ||
        r.restaurantName?.toLowerCase().includes(query) ||
        r.title?.toLowerCase().includes(query) ||
        r.content?.toLowerCase().includes(query)
      );
    });
  }, [adminReviews, reviewSearchQuery]);

  const handleDeleteReview = async (reviewId) => {
    try {
      if (window.confirm("Delete this review permanently?")) {
        await deleteAdminReview(reviewId);
        setReplyingToId(null);
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  const handleReplySubmit = async (reviewId) => {
    const comment = (replyDrafts[reviewId] || "").trim();
    if (!comment) {
      showToast("Reply cannot be empty.", "error");
      return;
    }
    try {
      await replyAdminReview(reviewId, comment);
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }));
      setReplyingToId(null);
    } catch (err) {
      console.error("Failed to reply to review:", err);
    }
  };

  const handleToggleVisibility = async (restaurantId) => {
    try {
      await toggleRestaurantVisibility(restaurantId);
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
    }
  };

  const handleRemoveReport = async (restaurantId) => {
    try {
      await clearRestaurantReport(restaurantId);
    } catch (err) {
      console.error("Failed to remove report:", err);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      if (window.confirm("Are you sure you want to delete this restaurant?")) {
        await deleteRestaurant(restaurantId);
      }
    } catch (err) {
      console.error("Failed to delete restaurant:", err);
    }
  };

  const handleFeatureToggle = (feat) => {
    if (newRestaurantFeatures.includes(feat)) {
      setNewRestaurantFeatures((prev) => prev.filter((f) => f !== feat));
    } else {
      setNewRestaurantFeatures((prev) => [...prev, feat]);
    }
  };

  const handleCreateRestaurantSubmit = async (e) => {
    e.preventDefault();

    if (!newRestaurantName.trim()) {
      showToast("Restaurant name is required.", "error");
      return;
    }

    const payload = {
      name: newRestaurantName.trim(),
      description: newRestaurantDescription.trim(),
      cuisineType: newRestaurantCuisine
        ? newRestaurantCuisine
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : [],
      address: newRestaurantAddress.trim(),
      city: newRestaurantCity.trim(),
      phone: newRestaurantPhone.trim(),
      email: newRestaurantEmail.trim(),
      website: newRestaurantWebsite.trim(),
      restaurantImage: newRestaurantImageFile || newRestaurantImage.trim(),
      capacity: Number(newRestaurantCapacity) || 20,
      openingTime: newRestaurantOpeningTime,
      closingTime: newRestaurantClosingTime,
      priceRange: newRestaurantPriceRange,
      features: newRestaurantFeatures,
    };

    try {
      const created = await createRestaurant(payload);
      const restaurantId = created.id || created._id;

      if (newRestaurantGalleryFiles.length > 0) {
        try {
          await uploadRestaurantGallery(restaurantId, newRestaurantGalleryFiles);
        } catch (galleryError) {
          console.error("Gallery upload failed:", galleryError);
          showToast("Restaurant created, but gallery upload failed.", "error");
        }
      }

      // Reset form
      setNewRestaurantName("");
      setNewRestaurantDescription("");
      setNewRestaurantCuisine("");
      setNewRestaurantAddress("");
      setNewRestaurantCity("");
      setNewRestaurantPhone("");
      setNewRestaurantEmail("");
      setNewRestaurantWebsite("");
      setNewRestaurantImage("");
      setNewRestaurantImageFile(null);
      setNewRestaurantCapacity(20);
      setNewRestaurantOpeningTime("09:00");
      setNewRestaurantClosingTime("22:00");
      setNewRestaurantPriceRange("$$");
      setNewRestaurantFeatures([]);
      setNewRestaurantGalleryFiles([]);
      setIsCreateMode(false);

      showToast("Restaurant created successfully.", "success");
      await fetchAdminRestaurantsByStatus();
    } catch (error) {
      console.error("Create restaurant failed:", error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isAdminAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-sm"
          >
            <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Activity className="text-amber-400" size={32} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">
              Admin login required
            </h1>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Sign in with an admin account to manage restaurants and accept or reject reservations.
            </p>
            <button
              onClick={() => openAuthModal("login")}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold transition-all shadow-lg"
            >
              Log in as Admin
            </button>
          </motion.div>
        ) : (
          <>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white leading-tight">
                  Administrative Control Panel
                </h1>
                <p className="text-slate-300 mt-2">
                  Manage restaurants, reservations, and user reviews
                </p>
              </div>
            </div>
            {activeTab === "restaurants" && (
              <button
                onClick={() => setIsCreateMode(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Plus size={20} />
                Add Restaurant
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("restaurants")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "restaurants"
                  ? "bg-amber-500 text-white shadow-lg"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              Restaurants
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "reservations"
                  ? "bg-amber-500 text-white shadow-lg"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              Reservations
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "reviews"
                  ? "bg-amber-500 text-white shadow-lg"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              Reviews
            </button>
          </div>
        </motion.div>

        {activeTab === "restaurants" && (
          <>
        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
              Total Restaurants
            </div>
            <div className="text-3xl font-black text-white">{stats.total}</div>
            <div className="text-slate-400 text-xs mt-2 font-semibold">
              Active on platform
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm hover:bg-emerald-500/20 transition-all">
            <div className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              <Eye size={12} />
              Visible
            </div>
            <div className="text-3xl font-black text-emerald-400">{stats.visible}</div>
            <div className="text-emerald-300 text-xs mt-2 font-semibold">
              Currently listed
            </div>
          </div>

          <div className="bg-slate-600/10 border border-slate-600/30 rounded-2xl p-6 backdrop-blur-sm hover:bg-slate-600/20 transition-all">
            <div className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              <EyeOff size={12} />
              Hidden
            </div>
            <div className="text-3xl font-black text-slate-300">{stats.hidden}</div>
            <div className="text-slate-400 text-xs mt-2 font-semibold">
              Unlisted temporarily
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm hover:bg-red-500/20 transition-all">
            <div className="text-red-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              <AlertCircle size={12} />
              Reported
            </div>
            <div className="text-3xl font-black text-red-400">{stats.reported}</div>
            <div className="text-red-300 text-xs mt-2 font-semibold">
              Needs attention
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm hover:bg-amber-500/20 transition-all">
            <div className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              <Star size={12} />
              Avg Rating
            </div>
            <div className="text-3xl font-black text-amber-400">{stats.avgRating}</div>
            <div className="text-amber-300 text-xs mt-2 font-semibold">
              Platform average
            </div>
          </div>
        </motion.div>

        {/* Search & Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                Search Restaurant
              </label>
              <input
                type="text"
                placeholder="Search by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                Filter Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Restaurants</option>
                <option value="visible">Visible Only</option>
                <option value="hidden">Hidden Only</option>
                <option value="reported">Reported Only</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all appearance-none cursor-pointer"
              >
                <option value="name">Name (A-Z)</option>
                <option value="rating">Rating (High to Low)</option>
                <option value="reviews">Reviews (Most)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                Results
              </label>
              <div className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white font-semibold flex items-center justify-between">
                <span>{filteredRestaurants.length}</span>
                <span className="text-xs text-slate-400">
                  of {restaurants.length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto">
            {filteredRestaurants.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                      Owner / User
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                      Restaurant
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                      Reviews
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                      Reports
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRestaurants.map((restaurant, index) => (
                    <motion.tr
                      key={restaurant._id || restaurant.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-all group"
                    >
                      {/* Owner Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center font-bold text-white text-xs">
                            {(restaurant.ownerId?.username || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {restaurant.ownerId?.username || "Unknown Owner"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {restaurant.city || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Restaurant Name */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">
                          {restaurant.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {restaurant.cuisineType?.[0] || "Multi-cuisine"}
                        </div>
                      </td>

                      {/* Rating with Stars */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <RatingStars
                            rating={restaurant.rating || 0}
                            size="sm"
                          />
                          <span className="text-sm font-bold text-white">
                            {(restaurant.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </td>

                      {/* Review Count */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 bg-slate-700/30 px-3 py-1 rounded-lg">
                          <Users size={13} className="text-slate-400" />
                          <span className="text-sm font-bold text-white">
                            {restaurant.reviewCount || 0}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider border ${
                            restaurant.isActive !== false
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                          }`}
                        >
                          {restaurant.isActive !== false ? (
                            <>
                              <Eye size={13} />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff size={13} />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>

                      {/* Reported Status */}
                      <td className="px-6 py-4">
                        {restaurant.reported ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                            <AlertCircle size={13} />
                            Reported
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-semibold">
                            Clear
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              handleToggleVisibility(
                                restaurant._id || restaurant.id
                              )
                            }
                            className={`p-2 rounded-lg transition-all ${
                              restaurant.isActive !== false
                                ? "bg-slate-600/50 hover:bg-slate-600 text-slate-200"
                                : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                            }`}
                            title={
                              restaurant.isActive !== false
                                ? "Deactivate Restaurant"
                                : "Activate Restaurant"
                            }
                          >
                            {restaurant.isActive !== false ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>

                          {restaurant.reported && (
                            <button
                              onClick={() =>
                                handleRemoveReport(
                                  restaurant._id || restaurant.id
                                )
                              }
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
                              title="Remove Report"
                            >
                              <AlertCircle size={16} />
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleDeleteRestaurant(
                                restaurant._id || restaurant.id
                              )
                            }
                            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-all"
                            title="Delete Restaurant"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-300 font-semibold text-lg">
                  No restaurants found
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </motion.div>
          </>
        )}

        {activeTab === "reservations" && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Total Reservations
                </div>
                <div className="text-3xl font-black text-white">{reservationStats.total}</div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Clock size={12} />
                  Pending
                </div>
                <div className="text-3xl font-black text-indigo-400">{reservationStats.pending}</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                  <CalendarCheck2 size={12} />
                  Confirmed
                </div>
                <div className="text-3xl font-black text-emerald-400">{reservationStats.confirmed}</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-red-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                  <X size={12} />
                  Cancelled
                </div>
                <div className="text-3xl font-black text-red-400">{reservationStats.cancelled}</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                    Search Reservations
                  </label>
                  <input
                    type="text"
                    placeholder="Search by customer or restaurant..."
                    value={reservationSearchQuery}
                    onChange={(e) => setReservationSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                    Filter Status
                  </label>
                  <select
                    value={reservationFilterStatus}
                    onChange={(e) => setReservationFilterStatus(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                    Results
                  </label>
                  <div className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white font-semibold flex items-center justify-between">
                    <span>{filteredReservations.length}</span>
                    <span className="text-xs text-slate-400">
                      of {adminReservations.length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden shadow-2xl"
            >
              <div className="overflow-x-auto">
                {filteredReservations.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                          Restaurant
                        </th>
                        <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                          Date & Time
                        </th>
                        <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                          Party Size
                        </th>
                        <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-black text-slate-300 uppercase tracking-widest text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredReservations.map((res) => (
                        <tr key={res.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white text-sm">
                              {res.customerName || "—"}
                            </div>
                            <div className="text-slate-400 text-xs mt-0.5">
                              {res.customerEmail || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-200">
                            {res.restaurantName || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-200 font-semibold">
                              {formatDate(res.date)}
                            </div>
                            <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                              <Clock size={11} />
                              {res.time}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm font-bold">
                              <Users size={12} />
                              {res.partySize || res.guests} guests
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                                res.status === "confirmed"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : res.status === "cancelled"
                                    ? "bg-slate-600/20 text-slate-400 border-slate-600/30"
                                    : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                              }`}
                            >
                              {res.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {res.status === "pending" && (
                                <button
                                  onClick={() => handleAcceptReservation(res.id)}
                                  className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold rounded-lg transition-all flex items-center gap-1 text-xs uppercase tracking-wider"
                                >
                                  <Check size={12} />
                                  Accept
                                </button>
                              )}
                              {res.status !== "cancelled" && (
                                <button
                                  onClick={() => handleRejectReservation(res.id)}
                                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold rounded-lg transition-all flex items-center gap-1 text-xs uppercase tracking-wider"
                                >
                                  <X size={12} />
                                  Reject
                                </button>
                              )}
                              {res.status === "cancelled" && (
                                <span className="text-xs text-slate-500 italic">
                                  No further actions
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarCheck2 size={32} className="text-slate-400" />
                    </div>
                    <p className="text-slate-300 font-semibold text-lg">
                      No reservations found
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {activeTab === "reviews" && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Total Reviews
                </div>
                <div className="text-3xl font-black text-white">{reviewStats.total}</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Star size={12} />
                  Avg Rating
                </div>
                <div className="text-3xl font-black text-amber-400">{reviewStats.avgRating}</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                  <MessageSquare size={12} />
                  Replied
                </div>
                <div className="text-3xl font-black text-emerald-400">{reviewStats.withReplies}</div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Clock size={12} />
                  Unanswered
                </div>
                <div className="text-3xl font-black text-indigo-400">{reviewStats.unanswered}</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                    Search Reviews
                  </label>
                  <input
                    type="text"
                    placeholder="Search by reviewer, restaurant, or content..."
                    value={reviewSearchQuery}
                    onChange={(e) => setReviewSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                    Filter Rating
                  </label>
                  <select
                    value={reviewRatingFilter}
                    onChange={(e) => setReviewRatingFilter(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                    Results
                  </label>
                  <div className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white font-semibold flex items-center justify-between">
                    <span>{filteredReviews.length}</span>
                    <span className="text-xs text-slate-400">
                      of {adminReviews.length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="font-bold text-white">
                            {review.reviewerName || "Anonymous"}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {review.reviewerEmail}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {formatDate(review.date)}
                          </span>
                        </div>
                        <div className="text-amber-300 text-sm font-semibold mb-1">
                          {review.restaurantName || "Unknown restaurant"}
                        </div>
                        <div className="mb-2">
                          <RatingStars rating={review.rating} />
                        </div>
                        {review.title && (
                          <h4 className="text-white font-bold text-sm mb-1">
                            {review.title}
                          </h4>
                        )}
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {review.content || "No comment provided."}
                        </p>

                        {Array.isArray(review.responses) &&
                          review.responses.length > 0 && (
                            <div className="mt-4 space-y-2 pl-4 border-l-2 border-amber-500/30">
                              {review.responses.map((response) => (
                                <div
                                  key={response.id || response._id}
                                  className="bg-amber-500/5 rounded-xl px-4 py-3"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <MessageSquare
                                      size={12}
                                      className="text-amber-400"
                                    />
                                    <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">
                                      {response.authorRole === "admin"
                                        ? "Admin reply"
                                        : "Reply"}{" "}
                                      · {response.authorName}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-sm">
                                    {response.comment}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                        {replyingToId === review.id && (
                          <div className="mt-4 space-y-2">
                            <textarea
                              value={replyDrafts[review.id] || ""}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({
                                  ...prev,
                                  [review.id]: e.target.value,
                                }))
                              }
                              rows={3}
                              placeholder="Write an admin reply..."
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReplySubmit(review.id)}
                                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold rounded-lg transition-all flex items-center gap-1.5 text-xs uppercase tracking-wider"
                              >
                                <Send size={12} />
                                Post Reply
                              </button>
                              <button
                                onClick={() => setReplyingToId(null)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold rounded-lg transition-all text-xs uppercase tracking-wider"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {replyingToId !== review.id && (
                          <button
                            onClick={() => setReplyingToId(review.id)}
                            className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold rounded-lg transition-all flex items-center gap-1 text-xs uppercase tracking-wider"
                          >
                            <MessageSquare size={12} />
                            Reply
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold rounded-lg transition-all flex items-center gap-1 text-xs uppercase tracking-wider"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl text-center py-16">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star size={32} className="text-slate-400" />
                  </div>
                  <p className="text-slate-300 font-semibold text-lg">
                    No reviews found
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Create Restaurant Modal */}
        {isCreateMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setIsCreateMode(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Add New Restaurant</h2>
                <button
                  onClick={() => setIsCreateMode(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <X size={24} className="text-slate-300" />
                </button>
              </div>

              <form onSubmit={handleCreateRestaurantSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Restaurant Name *
                    </label>
                    <input
                      type="text"
                      value={newRestaurantName}
                      onChange={(e) => setNewRestaurantName(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                      placeholder="Restaurant name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={newRestaurantCity}
                      onChange={(e) => setNewRestaurantCity(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                      placeholder="City"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                    Description
                  </label>
                  <textarea
                    value={newRestaurantDescription}
                    onChange={(e) => setNewRestaurantDescription(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                    placeholder="Restaurant description"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Cuisine Types (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newRestaurantCuisine}
                      onChange={(e) => setNewRestaurantCuisine(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                      placeholder="Italian, French"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Price Range
                    </label>
                    <select
                      value={newRestaurantPriceRange}
                      onChange={(e) => setNewRestaurantPriceRange(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer"
                    >
                      <option value="$">$ (Budget)</option>
                      <option value="$$">$$ (Moderate)</option>
                      <option value="$$$">$$$ (Expensive)</option>
                      <option value="$$$$">$$$$ (Luxury)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={newRestaurantAddress}
                      onChange={(e) => setNewRestaurantAddress(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newRestaurantPhone}
                      onChange={(e) => setNewRestaurantPhone(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newRestaurantEmail}
                      onChange={(e) => setNewRestaurantEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                      placeholder="info@restaurant.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={newRestaurantWebsite}
                      onChange={(e) => setNewRestaurantWebsite(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                      placeholder="https://restaurant.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={newRestaurantCapacity}
                      onChange={(e) => setNewRestaurantCapacity(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={newRestaurantOpeningTime}
                      onChange={(e) => setNewRestaurantOpeningTime(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={newRestaurantClosingTime}
                      onChange={(e) => setNewRestaurantClosingTime(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-3">
                    Features
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Outdoor Seating",
                      "Chef Table Only",
                      "Pre-Payment Required",
                      "Sake Flight Pairings",
                      "Romantic Dinner Settings",
                      "Intimate Minimalist Vibe",
                      "Valet Parking Available",
                      "Private Dining Rooms",
                      "Gluten-Free Menu Options",
                    ].map((feat) => (
                      <label key={feat} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={newRestaurantFeatures.includes(feat)}
                          onChange={() => handleFeatureToggle(feat)}
                          className="w-4 h-4 rounded border-white/20 cursor-pointer"
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition">{feat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Restaurant Image URL
                    </label>
                    <input
                      type="url"
                      value={newRestaurantImage}
                      onChange={(e) => setNewRestaurantImage(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-2">
                      Gallery Files
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setNewRestaurantGalleryFiles(Array.from(e.target.files))}
                      className="w-full text-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all"
                  >
                    Create Restaurant
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateMode(false)}
                    className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
