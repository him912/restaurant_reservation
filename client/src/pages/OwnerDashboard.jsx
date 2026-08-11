/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { RatingStars } from "../components/RatingStars";
import {
  TrendingUp,
  BookmarkCheck,
  CalendarCheck2,
  Clock,
  ShieldAlert,
  Save,
  Check,
  X,
  RefreshCw,
  Sliders,
  IndianRupee,
  Star,
  Users,
  ChevronDown,
  Plus,
} from "lucide-react";
import { formatMenuPrice } from "../utils/currency";
import { PaymentStatusBadge } from "../components/PaymentStatusBadge";
import { usePolling } from "../hooks/usePolling";
import { sortReservationsByCreatedAt } from "../utils/sortReservations";
import { api } from "../api";
import { canAcceptReservation, isReservationPast } from "../utils/reservationLifecycle";
import { motion } from "motion/react";

export const OwnerDashboard = () => {
  const {
    restaurants,
    ownerReservations,
    changeBookingStatus,
    fetchOwnerReservations,
    createRestaurant,
    uploadRestaurantGallery,
    updateRestaurantProfile,
    deleteRestaurant,
    updateMenuItem,
    deleteMenuItem,
    addMenuItem,
    showToast,
  } = useApp();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
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
  const [newRestaurantOpeningTime, setNewRestaurantOpeningTime] =
    useState("09:00");
  const [newMenuItemName, setNewMenuItemName] = useState("");
  const [newMenuItemDescription, setNewMenuItemDescription] = useState("");
  const [newMenuItemCategory, setNewMenuItemCategory] = useState("Desserts");
  const [newMenuItemPrice, setNewMenuItemPrice] = useState("");
  const [newMenuItemImage, setNewMenuItemImage] = useState("");
  const [newMenuItemAvailable, setNewMenuItemAvailable] = useState(true);
  const [newRestaurantClosingTime, setNewRestaurantClosingTime] =
    useState("22:00");
  const [newRestaurantPriceRange, setNewRestaurantPriceRange] = useState("$$");
  const [newRestaurantFeatures, setNewRestaurantFeatures] = useState([]);
  const [newRestaurantGalleryFiles, setNewRestaurantGalleryFiles] = useState(
    [],
  );

  useEffect(() => {
    api.getPaymentConfig().then(setPaymentConfig).catch(() => {});
  }, []);

  useEffect(() => {
    if (restaurants.length === 0) {
      setSelectedRestaurantId(null);
      return;
    }

    const stillValid = restaurants.some(
      (r) => r.id === selectedRestaurantId || r._id === selectedRestaurantId,
    );

    if (!selectedRestaurantId || !stillValid) {
      setSelectedRestaurantId(restaurants[0].id || restaurants[0]._id);
      setIsCreateMode(false);
    }
  }, [restaurants, selectedRestaurantId]);

  // Load bookings for the owner's restaurants
  useEffect(() => {
    const loadOwnerBookings = async () => {
      try {
        await fetchOwnerReservations(
          isCreateMode ? null : selectedRestaurantId || null,
        );
      } catch (err) {
        console.error("Failed to load owner reservations:", err);
      }
    };
    loadOwnerBookings();
  }, [selectedRestaurantId, isCreateMode, fetchOwnerReservations]);

  const reloadOwnerBookings = React.useCallback(async () => {
    await fetchOwnerReservations(isCreateMode ? null : selectedRestaurantId || null);
  }, [fetchOwnerReservations, isCreateMode, selectedRestaurantId]);

  usePolling(
    () => {
      reloadOwnerBookings().catch((err) =>
        console.error("Failed to refresh owner reservations:", err),
      );
    },
    15000,
    true,
  );

  const restaurant = useMemo(() => {
    if (isCreateMode) return null;
    return (
      restaurants.find(
        (r) => r.id === selectedRestaurantId || r._id === selectedRestaurantId,
      ) ||
      restaurants[0] ||
      null
    );
  }, [restaurants, selectedRestaurantId, isCreateMode]);

  // Bookings for the selected restaurant (or all owned venues)
  const ownerBookings = useMemo(() => {
    let list = ownerReservations;
    if (selectedRestaurantId && !isCreateMode) {
      list = ownerReservations.filter(
        (r) =>
          String(r.restaurantId) === String(selectedRestaurantId) ||
          !selectedRestaurantId,
      );
    }
    return sortReservationsByCreatedAt(list);
  }, [ownerReservations, selectedRestaurantId, isCreateMode]);

  const shouldShowCreateForm = isCreateMode || (!restaurant && restaurants.length === 0);

  useEffect(() => {
    if (restaurant && !isCreateMode) {
      setName(restaurant.name || "");
      setDescription(restaurant.description || "");
      setPhone(restaurant.phone || "");
      setEmail(restaurant.email || "");
      setCapacity(restaurant.capacity || 20);
      setOpeningHours(
        restaurant.openingTime && restaurant.closingTime
          ? `${restaurant.openingTime} - ${restaurant.closingTime}`
          : "5:00 PM - 11:00 PM",
      );
      setSelectedFeatures(restaurant.features || []);
    }
  }, [restaurant, isCreateMode]);

  // States to edit restaurant profile
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [capacity, setCapacity] = useState(20);
  const [openingHours, setOpeningHours] = useState("5:00 PM - 11:00 PM");
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [editMenuFields, setEditMenuFields] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    image: "",
    available: true,
  });

  const [activeTab, setActiveTab] = useState("bookings");

  // Compute stats across owner restaurant bookings
  const totalBookings = ownerBookings.length;
  const confirmedBookings = ownerBookings.filter(
    (r) => r.status === "confirmed",
  ).length;
  const pendingBookings = ownerBookings.filter(
    (r) => r.status === "pending",
  ).length;
  const cancelledBookings = ownerBookings.filter(
    (r) => r.status === "cancelled",
  ).length;

  // Revenue estimation: average dining covers are ₹1,500/guest for confirmed bookings
  const estRevenue = useMemo(() => {
    return ownerBookings
      .filter((r) => r.status === "confirmed")
      .reduce((sum, r) => sum + (r.guests || r.partySize || 0) * 1500, 0);
  }, [ownerBookings]);

  // Handle Feature checkboxes toggle
  const handleFeatureToggle = (feat) => {
    if (isCreateMode) {
      if (newRestaurantFeatures.includes(feat)) {
        setNewRestaurantFeatures((prev) => prev.filter((f) => f !== feat));
      } else {
        setNewRestaurantFeatures((prev) => [...prev, feat]);
      }
    } else {
      if (selectedFeatures.includes(feat)) {
        setSelectedFeatures((prev) => prev.filter((f) => f !== feat));
      } else {
        setSelectedFeatures((prev) => [...prev, feat]);
      }
    }
  };

  const handleCreateRestaurantSubmit = async (e) => {
    e.preventDefault();

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
      capacity: Number(newRestaurantCapacity) || 0,
      openingTime: newRestaurantOpeningTime,
      closingTime: newRestaurantClosingTime,
      priceRange: newRestaurantPriceRange,
      features: newRestaurantFeatures,
    };

    try {
      const created = await createRestaurant(payload);
      const restaurantId = created.id || created._id;
      setSelectedRestaurantId(restaurantId);
      setNewRestaurantImage("");
      setNewRestaurantImageFile(null);

      if (newRestaurantGalleryFiles.length > 0) {
        try {
          await uploadRestaurantGallery(
            restaurantId,
            newRestaurantGalleryFiles,
          );
        } catch (galleryError) {
          console.error("Gallery upload failed:", galleryError);
          showToast("Restaurant created, but gallery upload failed.", "error");
        }
      }

      setIsCreateMode(false);
      setNewRestaurantGalleryFiles([]);
      showToast("Restaurant created successfully.", "success");
    } catch (error) {
      console.error("Create restaurant failed:", error);
    }
  };

  const handleAddMenuItemSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    const payload = {
      name: newMenuItemName.trim(),
      description: newMenuItemDescription.trim(),
      category: newMenuItemCategory.trim(),
      price: Number(newMenuItemPrice) || 0,
      image: newMenuItemImage.trim(),
      available: newMenuItemAvailable,
    };

    try {
      await addMenuItem(restaurant.id || restaurant._id, payload);
      setNewMenuItemName("");
      setNewMenuItemDescription("");
      setNewMenuItemCategory("Desserts");
      setNewMenuItemPrice("");
      setNewMenuItemImage("");
      setNewMenuItemAvailable(true);
      showToast("Menu item added successfully.", "success");
    } catch (error) {
      console.error("Add menu item failed:", error);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!restaurant) return;

    try {
      await deleteRestaurant(restaurant.id || restaurant._id);
      setSelectedRestaurantId(restaurants[0]?.id || restaurants[0]?._id || null);
      showToast('Restaurant deleted successfully.', 'success');
    } catch (error) {
      console.error('Delete restaurant failed:', error);
    }
  };

  const activeFeatureSelection = isCreateMode
    ? newRestaurantFeatures
    : selectedFeatures;

  // Preset features list they can check off
  const availableFeatures = [
    "Outdoor Seating",
    "Live Music",
    "Chef Table Only",
    "Pre-Payment Required",
    "Sake Flight Pairings",
    "Romantic Dinner Settings",
    "Intimate Minimalist Vibe",
    "Valet Parking Available",
    "Private Dining Rooms",
    "Gluten-Free Menu Options",
    "Vegan-Only Cooking Stations",
    "100% Organic Ingredients",
    "Vegetarian Friendly",
    "Halal Options",
    "Pet Friendly Patio",
    "Wheelchair Accessible",
    "Free Wi-Fi",
    "Bar & Lounge",
    "Family Friendly",
    "Rooftop Views",
  ];

  // Save profile updates
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    const [openingTimeValue, closingTimeValue] = openingHours
      .split("-")
      .map((part) => part.trim());

    const updated = {
      ...restaurant,
      name,
      description,
      phone,
      email,
      capacity: Number(capacity),
      openingTime: openingTimeValue || restaurant.openingTime,
      closingTime: closingTimeValue || restaurant.closingTime,
      features: selectedFeatures,
    };

    await updateRestaurantProfile(updated);
  };

  // Format date helper
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12" id="owner-dashboard-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header strip */}
        <section
          className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10"
          id="owner-header-box"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center text-lg shadow-lg">
              <Sliders size={22} />
            </div>
            <div>
              <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest font-mono">
                Administrative Control Cockpit
              </span>
              <h1 className="text-2xl font-black text-white leading-tight">
                Universal Booking Manager
              </h1>
              <p className="text-slate-450 text-xs mt-0.5">
                Administer reserve requests, seat allocations, and core site
                profiles.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full sm:w-auto min-w-[240px]">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Your Restaurants
              </label>
              <div className="relative">
                <select
                  value={
                    isCreateMode
                      ? "__create__"
                      : selectedRestaurantId || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "__create__") {
                      setIsCreateMode(true);
                      setSelectedRestaurantId(null);
                      setActiveTab("profile");
                      return;
                    }
                    setSelectedRestaurantId(value);
                    setIsCreateMode(false);
                  }}
                  className="w-full appearance-none bg-slate-950 border border-slate-600 hover:border-indigo-400 focus:border-indigo-500 text-slate-100 rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition cursor-pointer"
                  id="owner-restaurant-select"
                >
                  {isCreateMode && (
                    <option value="__create__">+ New Restaurant</option>
                  )}
                  {restaurants.length === 0 && !isCreateMode && (
                    <option value="">No restaurants yet</option>
                  )}
                  {restaurants.map((r) => (
                    <option key={r.id || r._id} value={r.id || r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreateMode(true);
                setSelectedRestaurantId(null);
                setActiveTab("profile");
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
              }}
              className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30"
              id="owner-add-restaurant-btn"
            >
              <Plus size={14} />
              Add New Restaurant
            </button>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab("bookings")}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer ${
                activeTab === "bookings"
                  ? "bg-indigo-600 text-white font-extrabold shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
              id="tab-btn-bookings"
            >
              Control Desk
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("profile");
                // Leaving create mode without a selection: restore first restaurant if any
                if (isCreateMode && restaurants.length > 0 && !selectedRestaurantId) {
                  // keep create mode if user just opened Add New; form is on profile tab
                } else if (!restaurant && restaurants.length > 0) {
                  setSelectedRestaurantId(restaurants[0].id || restaurants[0]._id);
                  setIsCreateMode(false);
                }
              }}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer ${
                activeTab === "profile"
                  ? "bg-indigo-600 text-white font-extrabold shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
              id="tab-btn-profile"
            >
              My Profile Detail
            </button>
          </div>
        </section>

        {/* Dynamic Statistics cards */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          id="owner-dashboard-metrics"
        >
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
              <IndianRupee size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Est. Revenue
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                ₹{estRevenue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-700 border border-indigo-101">
              <CalendarCheck2 size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Confirmed
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {confirmedBookings} tables
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 border border-slate-200">
              <RefreshCw size={14} className="animate-spin duration-[4s]" />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Pending Desk
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {pendingBookings} awaiting
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200">
              <ShieldAlert size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Cancelled
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {cancelledBookings} counts
              </span>
            </div>
          </div>
        </section>

        {/* Content Tabs switches */}
        {activeTab === "bookings" ? (
          /* BOOKINGS DESK INTERFACE */
          <div
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            id="bookings-action-interface"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Reservations Control Desk
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Accept or reject bookings for your restaurant — pending requests need your approval.
                </p>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto" id="reservations-table-container">
              {ownerBookings.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-extrabold text-[10px]">
                      <th className="p-4 pl-6">Consumer Details</th>
                      <th className="p-4">Est. Venue Name</th>
                      <th className="p-4">Dining Particulars</th>
                      <th className="p-4">Cover Seats</th>
                      <th className="p-4">State Status</th>
                      <th className="p-4 pr-6 text-right">
                        Interactive Command Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className="divide-y divide-slate-100"
                    id="reservations-table-body"
                  >
                    {ownerBookings.map((res) => (
                      <tr
                        key={res.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Consumer contact details */}
                        <td className="p-4 pl-6">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {res.customerName}
                          </div>
                          <div className="text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                            <span>{res.customerEmail}</span>
                            {res.customerPhone ? (
                              <>
                                <span>•</span>
                                <span>{res.customerPhone}</span>
                              </>
                            ) : null}
                          </div>
                        </td>

                        {/* Venue Title name */}
                        <td className="p-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                            <span>{res.restaurantName}</span>
                          </div>
                        </td>

                        {/* Date and Time slots */}
                        <td className="p-4 font-semibold text-slate-700">
                          <div>{formatDate(res.date)}</div>
                          <div className="text-slate-450 font-bold mt-0.5 flex items-center gap-1 uppercase tracking-wide">
                            <Clock size={11} />
                            <span>Slot {res.time}</span>
                          </div>
                        </td>

                        {/* Guest seat cover volume */}
                        <td className="p-4">
                          <span className="font-extrabold text-slate-900 text-sm bg-slate-50 border border-slate-155 py-1 px-2.5 rounded-lg flex items-center gap-1.5 w-max font-semibold">
                            <Users size={12} className="text-slate-400" />
                            <span>{res.guests || res.partySize} Guests</span>
                          </span>
                        </td>

                        {/* Status elements */}
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider border w-max ${
                              res.status === "confirmed"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : res.status === "cancelled"
                                  ? "bg-slate-100 text-slate-400 border-slate-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {res.status === "pending"
                              ? "awaiting approval"
                              : res.status === "cancelled" && isReservationPast(res)
                                ? "expired"
                                : res.status}
                          </span>
                        </td>

                        {/* Control Actions buttons */}
                        <td className="p-4 pr-6 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <PaymentStatusBadge
                              paymentStatus={res.paymentStatus}
                              paymentAmount={res.paymentAmount}
                              paymentCurrency={res.paymentCurrency}
                            />
                            {canAcceptReservation(res, paymentConfig) && (
                              <button
                                type="button"
                                onClick={() =>
                                  changeBookingStatus(res.id, "confirmed")
                                }
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm shrink-0 uppercase tracking-wider text-[9px] cursor-pointer"
                                id={`confirm-btn-${res.id}`}
                              >
                                <Check size={11} />
                                <span>Accept</span>
                              </button>
                            )}

                            {res.status !== "cancelled" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Reject / cancel this reservation?",
                                    )
                                  ) {
                                    changeBookingStatus(res.id, "cancelled");
                                  }
                                }}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 uppercase tracking-wider text-[9px] cursor-pointer"
                                id={`decline-btn-${res.id}`}
                              >
                                <X size={11} />
                                <span>Reject</span>
                              </button>
                            )}

                            {res.status === "cancelled" && (
                              <span className="text-[10px] text-slate-400 italic font-semibold">
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
                <div className="text-center py-12 text-slate-400 italic font-semibold">
                  No client reservations for this restaurant yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MANAGED RESTAURANT PROFILE INTERACTIVE FORM */
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            id="owner-profile-editor"
          >
            {/* Form details section container */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm" id="profile-editor-box">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900">
                  {shouldShowCreateForm
                    ? "Create New Restaurant"
                    : "Manage Restaurant Details"}
                </h3>
                {shouldShowCreateForm && restaurants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateMode(false);
                      const first = restaurants[0];
                      setSelectedRestaurantId(first.id || first._id);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-wider"
                  >
                    Cancel create
                  </button>
                )}
              </div>
              
              <form
                onSubmit={isCreateMode ? handleCreateRestaurantSubmit : handleProfileSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={shouldShowCreateForm ? newRestaurantName : name}
                      onChange={(e) =>
                        shouldShowCreateForm
                          ? setNewRestaurantName(e.target.value)
                          : setName(e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Core Operations Hours
                    </label>
                    {shouldShowCreateForm ? (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="time"
                          value={newRestaurantOpeningTime}
                          onChange={(e) =>
                            setNewRestaurantOpeningTime(e.target.value)
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                        />
                        <input
                          type="time"
                          value={newRestaurantClosingTime}
                          onChange={(e) =>
                            setNewRestaurantClosingTime(e.target.value)
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                    About / Description narrative
                  </label>
                  <textarea
                    rows={4}
                    value={isCreateMode ? newRestaurantDescription : description}
                    onChange={(e) =>
                      shouldShowCreateForm
                        ? setNewRestaurantDescription(e.target.value)
                        : setDescription(e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-550 text-slate-900 leading-relaxed transition-all"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={shouldShowCreateForm ? newRestaurantPhone : phone}
                      onChange={(e) =>
                        shouldShowCreateForm
                          ? setNewRestaurantPhone(e.target.value)
                          : setPhone(e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={shouldShowCreateForm ? newRestaurantEmail : email}
                      onChange={(e) =>
                        shouldShowCreateForm
                          ? setNewRestaurantEmail(e.target.value)
                          : setEmail(e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Seating Capacity
                    </label>
                    <input
                      type="number"
                      value={shouldShowCreateForm ? newRestaurantCapacity : capacity}
                      onChange={(e) =>
                        shouldShowCreateForm
                          ? setNewRestaurantCapacity(Number(e.target.value))
                          : setCapacity(Number(e.target.value))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                    />
                  </div>
                </div>

                {shouldShowCreateForm && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                        Address
                      </label>
                      <input
                        type="text"
                        value={newRestaurantAddress}
                        onChange={(e) =>
                          setNewRestaurantAddress(e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={newRestaurantCity}
                        onChange={(e) => setNewRestaurantCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                        Website
                      </label>
                      <input
                        type="text"
                        value={newRestaurantWebsite}
                        onChange={(e) =>
                          setNewRestaurantWebsite(e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                      />
                    </div>
                  </div>
                )}

                {shouldShowCreateForm && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={newRestaurantImage}
                        onChange={(e) => {
                          setNewRestaurantImage(e.target.value);
                          if (newRestaurantImageFile)
                            setNewRestaurantImageFile(null);
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                      />
                      <div className="mt-2">
                        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                          Or upload from device
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setNewRestaurantImageFile(file);
                            if (file) setNewRestaurantImage("");
                          }}
                          className="w-full text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white"
                        />
                        {newRestaurantImageFile && (
                          <div className="text-[11px] text-slate-500 mt-2">
                            Selected image: {newRestaurantImageFile.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                        Price Range
                      </label>
                      <select
                        value={newRestaurantPriceRange}
                        onChange={(e) =>
                          setNewRestaurantPriceRange(e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                      >
                        <option value="$">$</option>
                        <option value="$$">$$</option>
                        <option value="$$$">$$$</option>
                        <option value="$$$$">$$$$</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                        Cuisine Type
                      </label>
                      <input
                        type="text"
                        value={newRestaurantCuisine}
                        onChange={(e) =>
                          setNewRestaurantCuisine(e.target.value)
                        }
                        placeholder="e.g. Vegan, Healthy"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                      />
                    </div>
                  </div>
                )}

                {shouldShowCreateForm && (
                  <div className="space-y-3 mt-3">
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Upload up to 2 photos
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).slice(
                          0,
                          2,
                        );
                        setNewRestaurantGalleryFiles(files);
                      }}
                      className="w-full text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white"
                    />
                    {newRestaurantGalleryFiles.length > 0 && (
                      <div className="text-[11px] text-slate-500 space-y-1">
                        {newRestaurantGalleryFiles.map((file, index) => (
                          <div key={index}>
                            Photo {index + 1}: {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Features checkboxes */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-750 uppercase tracking-wider mb-3">
                    Amenities / Property Highlights
                  </label>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    id="amenities-check-grid"
                  >
                    {availableFeatures.map((feat) => {
                      const isChecked = activeFeatureSelection.includes(feat);
                      return (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => handleFeatureToggle(feat)}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isChecked
                              ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:border-slate-300"
                          }`}
                        >
                          <span>{feat}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${isChecked ? "bg-indigo-600 border-indigo-600 text-white font-bold" : "border-slate-300 bg-white"}`}
                          >
                            {isChecked && "✓"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-101 space-y-3">
                  <button
                    type="submit"
                    className="w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-755 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer shadow-indigo-950/15"
                  >
                    <Save size={13} />
                    <span>{isCreateMode ? 'CREATE RESTAURANT' : 'SAVE PROFILE MODIFICATIONS'}</span>
                  </button>
                  {!shouldShowCreateForm && restaurant && (
                    <button
                      type="button"
                      onClick={handleDeleteRestaurant}
                      className="w-full px-6 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl border border-rose-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X size={13} />
                      <span>DELETE RESTAURANT</span>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Profile static summary review card */}
            <div className="space-y-6">
              <div
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-hidden"
                id="card-preview"
              >
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                  Real-Time App Preview
                </h4>
                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                  <img
                    src={
                      isCreateMode
                        ? newRestaurantImage || restaurant?.restaurantImage || ''
                        : restaurant?.restaurantImage || ''
                    }
                    alt={isCreateMode ? newRestaurantName || restaurant?.name || 'Restaurant' : restaurant?.name || 'Restaurant'}
                    className="w-full aspect-[16/10] object-cover"
                  />
                  <div className="p-4 bg-slate-50 border-t border-slate-150">
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                      {isCreateMode
                        ? newRestaurantCuisine || restaurant?.cuisineType?.[0] || 'Cuisine'
                        : restaurant?.cuisineType?.[0] || 'Cuisine'}
                    </span>
                    <h5 className="font-extrabold text-sm text-slate-900 mt-1.5 leading-tight">
                      {isCreateMode ? newRestaurantName || 'New Restaurant' : name || restaurant?.name || 'Restaurant'}
                    </h5>
                    <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mt-1.5">
                      {isCreateMode ? newRestaurantDescription || restaurant?.description : description || restaurant?.description}
                    </p>

                    <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-150">
                      {(shouldShowCreateForm ? newRestaurantFeatures : selectedFeatures)
                        .slice(0, 2)
                        .map((f, i) => (
                          <span
                            key={i}
                            className="bg-white border border-slate-150 rounded-lg px-2 py-0.5 text-[9px] font-semibold text-slate-500"
                          >
                            {f}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {restaurant && !isCreateMode && (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm mt-6" id="owner-menu-management">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        Add Restaurant Menu Item
                      </h3>
                      <p className="text-slate-405 text-[11px] font-semibold">
                        Create a new menu item for this restaurant.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleAddMenuItemSubmit}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                          Dish Name
                        </label>
                        <input
                          type="text"
                          value={newMenuItemName}
                          onChange={(e) => setNewMenuItemName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                          Category
                        </label>
                        <input
                          type="text"
                          value={newMenuItemCategory}
                          onChange={(e) =>
                            setNewMenuItemCategory(e.target.value)
                          }
                          placeholder="Desserts"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={newMenuItemDescription}
                        onChange={(e) =>
                          setNewMenuItemDescription(e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                          Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMenuItemPrice}
                          onChange={(e) => setNewMenuItemPrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                          Image URL
                        </label>
                        <input
                          type="text"
                          value={newMenuItemImage}
                          onChange={(e) => setNewMenuItemImage(e.target.value)}
                          placeholder="https://example.com/dish.jpg"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                          Available
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newMenuItemAvailable}
                            onChange={(e) =>
                              setNewMenuItemAvailable(e.target.checked)
                            }
                            className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                          />
                          <span className="text-xs font-semibold text-slate-600">
                            Available
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        className="w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
                      >
                        Add Menu Item
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {restaurant &&
                !isCreateMode &&
                Array.isArray(restaurant.menuItems) &&
                restaurant.menuItems.map((item) => {
                const itemId = item.id || item._id;
                const isEditing = editingMenuItemId === String(itemId);
                const previewImage = isEditing
                  ? editMenuFields.image || item.image
                  : item.image;
                const itemContainerClass = isEditing
                  ? "flex flex-col gap-4 p-4 border border-slate-200 rounded-[28px] shadow-sm bg-slate-50 items-start"
                  : "flex flex-col lg:flex-row gap-4 p-4 border border-slate-200 rounded-[28px] shadow-sm bg-slate-50 items-start";

                return (
                  <div
                    key={itemId}
                    className={itemContainerClass}
                  >
                    <div className="flex-shrink-0 w-full lg:w-34 h-32 rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt={item.name || "Menu item"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-400 text-[11px] uppercase tracking-[.25em] text-center px-3">
                          No image available
                        </div>
                      )}
                    </div>

                    <div className="flex-2 min-w-0 grid gap-3">
                      {isEditing ? (
                        <form className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                                Dish Name
        </label>

        <input
          type="text"
          value={editMenuFields.name}
          onChange={(e) =>
            setEditMenuFields((s) => ({
              ...s,
              name: e.target.value,
            }))
          }
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
          Category
        </label>

        <input
          type="text"
          value={editMenuFields.category}
          onChange={(e) =>
            setEditMenuFields((s) => ({
              ...s,
              category: e.target.value,
            }))
          }
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
        />
      </div>
    </div>


    <div>
      <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
        Description
      </label>

      <textarea
        rows={3}
        value={editMenuFields.description}
        onChange={(e) =>
          setEditMenuFields((s) => ({
            ...s,
            description: e.target.value,
          }))
        }
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all resize-none"
      />
    </div>


    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
          Price
        </label>

        <input
          type="number"
          step="0.01"
          value={editMenuFields.price}
          onChange={(e) =>
            setEditMenuFields((s) => ({
              ...s,
              price: e.target.value,
            }))
          }
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
        />
      </div>


      <div>
        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
          Image URL
        </label>

        <input
          type="text"
          value={editMenuFields.image}
          onChange={(e) =>
            setEditMenuFields((s) => ({
              ...s,
              image: e.target.value,
            }))
          }
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
        />
              </div>


      <div className="flex flex-col justify-end">
        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
          Available
        </label>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!editMenuFields.available}
            onChange={(e) =>
              setEditMenuFields((s) => ({
                ...s,
                available: e.target.checked,
              }))
            }
            className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
          />

          <span className="text-xs font-semibold text-slate-600">
            Available
          </span>
        </div>
      </div>
    </div>
  </form>
) :  (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-black text-sm text-slate-900">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {item.category} • {formatMenuPrice(item.price)}
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[.2em] font-semibold ${
                                item.available
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {item.available ? "Available" : "Unavailable"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {item.description || "No description provided."}
                          </p>
                        </>
                      )}
                    </div>

                    <div className={`w-full lg:w-auto flex flex-col sm:flex-row justify-end gap-2 ${
    !isEditing ? "px-4" : ""
  }`}>
                        {isEditing ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const payload = {
                                  name: editMenuFields.name,
                                  description: editMenuFields.description,
                                  category: editMenuFields.category,
                                  price: Number(editMenuFields.price) || 0,
                                  image: editMenuFields.image || "",
                                  available: !!editMenuFields.available,
                                };
                                await updateMenuItem(
                                  restaurant.id || restaurant._id,
                                  itemId,
                                  payload,
                                );
                                setEditingMenuItemId(null);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-bold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMenuItemId(null)}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-end gap-2 pt-2 sm:pt-0">
  <button
    type="button"
    onClick={() => {
      setEditingMenuItemId(String(itemId));
      setEditMenuFields({
        name: item.name || "",
        description: item.description || "",
        category: item.category || "",
        price: item.price || "",
        image: item.image || "",
        available: item.available ?? true,
      });
    }}
        className="w-full sm:w-auto px-4 py-2 bg-amber-500 border border-rose-100 text-white rounded-2xl text-xs font-semibold"

  >
    Edit
  </button>

  <button
    type="button"
    onClick={async () => {
      if (!confirm("Delete this menu item?")) return;

      try {
        await deleteMenuItem(
          restaurant.id || restaurant._id,
          itemId,
        );
      } catch (err) {
        console.error(err);
      }
    }}
    className="w-full sm:w-auto px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold"
  >
    Delete
  </button>
</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
