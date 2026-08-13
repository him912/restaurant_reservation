/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { api } from "../api";
import { processReservationPayment } from "../utils/paymentFlow";

const API_URL = import.meta.env.VITE_API_URL;

const AppContext = createContext(undefined);

const normalizeRole = (r) => {
  if (!r) return "user";
  const map = {
    customer: "user",
    owner: "restaurant_owner",
    restaurant_owner: "restaurant_owner",
    user: "user",
    admin: "admin",
  };
  return map[r] || r;
};

const deriveNameFromEmail = (email) => {
  if (!email) return "Guest";
  const localPart = email.split("@")[0] || email;
  const parts = localPart.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return (
    parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || localPart
  );
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem("dineflow_token");
    if (!token) return null;

    const saved = localStorage.getItem("dineflow_current_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed && parsed.email ? parsed : null;
      } catch (_) {}
    }

    return null;
  });

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem("dineflow_registered_users");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [
      {
        name: "Marcus Sterling",
        email: "marcus@sterling.co",
        password: "password",
        role: "customer",
      },
      {
        name: "Chef Kenji (Owner)",
        email: "contact@sakuraomakase.com",
        password: "password",
        role: "owner",
      },
      {
        name: "Admin User",
        email: "admin@dineflow.com",
        password: "password",
        role: "admin",
      },
    ];
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [authModalTab, setAuthModalTab] = useState("login");
  const [restaurants, setRestaurants] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [ownerReservations, setOwnerReservations] = useState([]);
  const [adminReservations, setAdminReservations] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: null });

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        "dineflow_current_user",
        JSON.stringify(currentUser),
      );
    } else {
      localStorage.removeItem("dineflow_current_user");
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(
      "dineflow_registered_users",
      JSON.stringify(registeredUsers),
    );
  }, [registeredUsers]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const rList = await api.getRestaurants();
        const resList = await api.getReservations();
        setRestaurants(rList);
        setReservations(resList);
      } catch (err) {
        console.error("Error loading data in state: ", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: null }), 4000);
  };

  const hideToast = () => setToast({ message: "", type: null });

  const switchUserRole = (role) => {
    if (role === "restaurant_owner") {
      const ownerUser = registeredUsers.find(
        (u) => u.role === "restaurant_owner",
      ) || {
        name: "Chef Kenji (Owner)",
        email: "contact@sakuraomakase.com",
        role: "owner",
      };
      setCurrentUser(ownerUser);
      showToast(
        "Swapped to Restaurant Owner Mode (Managing Sakura Omakase)",
        "info",
      );
    } else if (role === "admin") {
      const adminUser = registeredUsers.find((u) => u.role === "admin") || {
        name: "Admin User",
        email: "admin@dineflow.com",
        role: "admin",
      };
      setCurrentUser(adminUser);
      showToast("Swapped to Admin Mode", "info");
    } else {
      const customerUser = registeredUsers.find((u) => u.role === "user") || {
        name: "Marcus Sterling",
        email: "marcus@sterling.co",
        role: "customer",
      };
      setCurrentUser(customerUser);
      showToast("Swapped to Customer Mode", "info");
    }
  };

  const openAuthModal = (tab = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const clearSessionState = () => {
    setRestaurants([]);
    setReservations([]);
    setOwnerReservations([]);
    setAdminReservations([]);
    setAdminReviews([]);
    setProfile(null);
  };

  const loadSessionData = async (role) => {
    try {
      const rList = await api.getRestaurants();
      setRestaurants(Array.isArray(rList) ? rList : []);

      if (role === "restaurant_owner") {
        const ownerList = await api.getOwnerReservations();
        setOwnerReservations(Array.isArray(ownerList) ? ownerList : []);
        setReservations([]);
      } else if (role === "admin") {
        setReservations([]);
        setOwnerReservations([]);
      } else {
        const resList = await api.getReservations();
        setReservations(Array.isArray(resList) ? resList : []);
        setOwnerReservations([]);
      }
    } catch (err) {
      console.error("Failed to load session data:", err);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { email: email.toLowerCase().trim(), password },
        { headers: { "Content-Type": "application/json" } },
      );
      const result = response.data || {};
      if (!result.success) {
        showToast(
          result.message || "Login failed. Please check credentials.",
          "error",
        );
        return false;
      }

      // Drop previous user session data before applying the new account
      clearSessionState();

      if (result.token) {
        localStorage.setItem("dineflow_token", result.token);
      }

      const payload = result.data || {};
      const userEmail = payload.email || email.toLowerCase().trim();
      const role = normalizeRole(payload.role || "customer");
      const name =
        payload.username || payload.name || deriveNameFromEmail(userEmail);
      setCurrentUser({
        id: payload.id,
        name,
        email: userEmail,
        role,
      });
      showToast(result.message || `Welcome back, ${name}!`, "success");

      try {
        const profileData = await api.getProfile();
        setProfile(profileData);
      } catch (profileErr) {
        console.error("Failed to load profile after login:", profileErr);
      }

      await loadSessionData(role);
      setIsAuthModalOpen(false);
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Invalid email credentials or password. Feel free to Create an Account.";
      showToast(message, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name, email, role, password) => {
    setIsLoading(true);
    if (!name || !email) {
      setIsLoading(false);
      showToast("Please provide your name and email address.", "error");
      return false;
    }

    try {
      const apiRole = normalizeRole(role);
      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          username: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          role: apiRole,
        },
        { headers: { "Content-Type": "application/json" } },
      );
      const result = response.data || {};
      if (!result.success) {
        showToast(
          result.message || "Registration failed. Please try again.",
          "error",
        );
        return false;
      }

      // Register does not return a JWT — log in immediately so protected routes work
      const loggedIn = await login(email, password);
      return loggedIn;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Registration failed. Please try again.";
      showToast(message, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    if (!email) {
      showToast("Please enter your email address.", "error");
      return false;
    }

    try {
      const response = await axios.post(
        `${API_URL}/auth/forgot-password`,
        { email: email.toLowerCase().trim() },
        { headers: { "Content-Type": "application/json" } },
      );

      const result = response.data || {};
      if (!result.success) {
        showToast(result.message || "Failed to send reset email.", "error");
        return false;
      }

      showToast(
        result.message || "Reset link sent to your email.",
        "success",
      );
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to send reset email. Please try again.";
      showToast(message, "error");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("dineflow_token");
    localStorage.removeItem("dineflow_current_user");
    setCurrentUser(null);
    clearSessionState();
    showToast("Successfully signed out of profile.", "info");
  };

  const refreshRestaurants = async () => {
    const list = await api.getRestaurants();
    setRestaurants(list);
  };

  const fetchAdminRestaurantsByStatus = useCallback(async (status = null) => {
    try {
      const list = await api.getAdminRestaurants(status);
      setRestaurants(list);
      return list;
    } catch (err) {
      console.error("Failed to fetch admin restaurants:", err);
      showToast("Failed to fetch restaurants.", "error");
      throw err;
    }
  }, []);

  const handleAuthFailure = (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      localStorage.removeItem("dineflow_token");
      localStorage.removeItem("dineflow_current_user");
      setCurrentUser(null);
      clearSessionState();
      showToast("Session expired. Please log in again.", "error");
      openAuthModal("login");
      return true;
    }
    if (status === 403) {
      showToast("Admin privileges required. Log in with an admin account.", "error");
      openAuthModal("login");
      return true;
    }
    return false;
  };

  const fetchAdminReservations = useCallback(async (status = null) => {
    try {
      const list = await api.getAdminReservations(status);
      setAdminReservations(list);
      return list;
    } catch (err) {
      console.error("Failed to fetch admin reservations:", err);
      if (!handleAuthFailure(err)) {
        showToast(
          err?.response?.data?.message || "Failed to fetch reservations.",
          "error",
        );
      }
      throw err;
    }
  }, []);

  const updateAdminReservationStatus = async (id, status) => {
    try {
      const updated = await api.updateAdminReservationStatus(id, status);
      setAdminReservations((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
      showToast(`Reservation ${status === "confirmed" ? "accepted" : "rejected"}.`, "success");
      return updated;
    } catch (err) {
      if (!handleAuthFailure(err)) {
        const message =
          err.response?.data?.message || "Failed to update reservation status.";
        showToast(message, "error");
      }
      throw err;
    }
  };

  const fetchAdminReviews = useCallback(async (filters = {}) => {
    try {
      const list = await api.getAdminReviews(filters);
      setAdminReviews(list);
      return list;
    } catch (err) {
      console.error("Failed to fetch admin reviews:", err);
      if (!handleAuthFailure(err)) {
        showToast(
          err?.response?.data?.message || "Failed to fetch reviews.",
          "error",
        );
      }
      throw err;
    }
  }, []);

  const deleteAdminReview = async (reviewId) => {
    try {
      await api.deleteAdminReview(reviewId);
      setAdminReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast("Review deleted.", "success");
    } catch (err) {
      if (!handleAuthFailure(err)) {
        showToast(
          err?.response?.data?.message || "Failed to delete review.",
          "error",
        );
      }
      throw err;
    }
  };

  const replyAdminReview = async (reviewId, comment) => {
    try {
      const updated = await api.replyAdminReview(reviewId, comment);
      setAdminReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? updated : r)),
      );
      showToast("Reply posted.", "success");
      return updated;
    } catch (err) {
      if (!handleAuthFailure(err)) {
        showToast(
          err?.response?.data?.message || "Failed to post reply.",
          "error",
        );
      }
      throw err;
    }
  };

  const refreshReservations = useCallback(async () => {
    const list = await api.getReservations();
    setReservations(list);
  }, []);

  const addNewReservation = async (res) => {
    try {
      const created = await api.createReservation(res);
      setReservations((prev) => [created, ...prev]);

      let payment = null;
      try {
        payment = await api.createPaymentCheckout(created.id);
        if (payment?.reservation) {
          const paidReservation = {
            ...created,
            ...normalizePaymentFields(payment.reservation),
          };
          setReservations((prev) =>
            prev.map((r) => (r.id === created.id ? paidReservation : r)),
          );
        }
      } catch (paymentErr) {
        console.error("Payment checkout failed:", paymentErr);
        showToast(
          paymentErr?.response?.data?.message ||
            "Reservation created, but payment could not be started.",
          "error",
        );
      }

      if (payment?.checkoutUrl) {
        showToast("Redirecting to secure payment…", "info");
      } else if (payment?.alreadyPaid || payment?.demoMode) {
        showToast(
          payment?.demoMode
            ? "Reservation submitted — deposit recorded (demo payment mode)"
            : "Reservation submitted — deposit paid",
          "success",
        );
      } else if (payment?.razorpayOrder) {
        // Payment window is opened by the booking page / retry flow.
      } else {
        showToast("Reservation submitted — awaiting approval", "success");
      }

      return {
        ...created,
        ...(payment?.reservation
          ? normalizePaymentFields(payment.reservation)
          : {}),
        checkoutUrl: payment?.checkoutUrl || null,
        razorpayOrder: payment?.razorpayOrder || null,
        paymentProvider: payment?.provider || null,
        paymentKeyId: payment?.keyId || null,
        paymentDemoMode: Boolean(payment?.demoMode),
        paymentAmount: payment?.amount || created.paymentAmount || 0,
      };
    } catch (err) {
      showToast(
        err?.response?.data?.message || err.message || "Failed to make reservation",
        "error",
      );
      throw err;
    }
  };

  const normalizePaymentFields = (reservation) => {
    if (!reservation) return {};
    return {
      paymentStatus: reservation.paymentStatus || "unpaid",
      paymentAmount: Number(reservation.paymentAmount || 0),
      paymentCurrency: reservation.paymentCurrency || "inr",
      paidAt: reservation.paidAt || null,
      status:
        reservation.status === "reserved"
          ? "confirmed"
          : reservation.status || "pending",
      id: reservation._id || reservation.id,
    };
  };

  const updateReservationInState = (updatedReservation) => {
    const normalized = {
      ...updatedReservation,
      ...normalizePaymentFields(updatedReservation),
    };

    setReservations((prev) =>
      prev.map((r) => (r.id === normalized.id ? { ...r, ...normalized } : r)),
    );

    return normalized;
  };

  const retryReservationPayment = async (reservation, paymentConfig) => {
    try {
      const paid = await processReservationPayment({
        reservation,
        currentUser,
        paymentConfig,
        onPaid: (updated) => {
          const merged = updateReservationInState(updated);
          showToast("Payment successful — deposit received.", "success");
          return merged;
        },
        onFailed: (reason) => {
          updateReservationInState({
            ...reservation,
            paymentStatus: "failed",
          });
          showToast(
            reason === "failed"
              ? "Payment failed. You can retry from your reservations."
              : "Payment cancelled. You can retry from your reservations.",
            "error",
          );
        },
      });

      if (paid) {
        return updateReservationInState(paid);
      }

      return null;
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Could not start payment. Try again.",
        "error",
      );
      throw err;
    }
  };

  const cancelUserReservation = async (id) => {
    try {
      await api.cancelReservation(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
      );
      showToast("Reservation has been cancelled.", "info");
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to cancel reservation.",
        "error",
      );
    }
  };

  const updateUserReservation = async (id, updates) => {
    try {
      const previous = reservations.find((r) => r.id === id);
      const updated = await api.updateReservation(id, updates, previous);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
      showToast("Reservation updated successfully.", "success");
      return updated;
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to update reservation.",
        "error",
      );
      throw err;
    }
  };

  const changeBookingStatus = async (id, status) => {
    try {
      const updated = await api.updateOwnerReservationStatus(id, status);
      setOwnerReservations((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
      showToast(
        `Reservation ${status === "confirmed" ? "accepted" : "rejected"}.`,
        "success",
      );
      return updated;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to update status.";
      showToast(message, "error");
      throw err;
    }
  };

  const fetchOwnerReservations = useCallback(async (restaurantId = null) => {
    try {
      const list = await api.getOwnerReservations(restaurantId);
      setOwnerReservations(list);
      return list;
    } catch (err) {
      console.error("Failed to fetch owner reservations:", err);
      showToast(
        err?.response?.data?.message || "Failed to fetch restaurant bookings.",
        "error",
      );
      throw err;
    }
  }, []);

  const submitRestaurantReview = async (review) => {
    try {
      const created = await api.addReview(review);
      await refreshRestaurants();
      showToast("Your review has been published!", "success");
      return created;
    } catch (err) {
      showToast("Failed to submit review.", "error");
      throw err;
    }
  };

  const createRestaurant = async (restaurantData) => {
    try {
      const created = await api.createRestaurant(restaurantData);
      setRestaurants((prev) => [created, ...prev]);
      showToast("Restaurant added successfully.", "success");
      return created;
    } catch (err) {
      showToast("Failed to add restaurant.", "error");
      throw err;
    }
  };

  const uploadRestaurantGallery = async (restaurantId, files = []) => {
    try {
      const updatedRestaurant = await api.uploadRestaurantGallery(
        restaurantId,
        files,
      );
      setRestaurants((prev) =>
        prev.map((restaurant) =>
          restaurant.id === updatedRestaurant.id ||
          restaurant._id === updatedRestaurant.id
            ? updatedRestaurant
            : restaurant,
        ),
      );
      showToast("Gallery images uploaded successfully.", "success");
      return updatedRestaurant;
    } catch (err) {
      showToast("Failed to upload gallery images.", "error");
      throw err;
    }
  };

  const addMenuItem = async (restaurantId, item) => {
    try {
      const updatedRestaurant = await api.addMenuItem(restaurantId, item);
      setRestaurants((prev) =>
        prev.map((restaurant) =>
          restaurant.id === updatedRestaurant.id ||
          restaurant._id === updatedRestaurant.id
            ? updatedRestaurant
            : restaurant,
        ),
      );
      showToast("Menu item added successfully.", "success");
      return updatedRestaurant;
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to add menu item.",
        "error",
      );
      throw err;
    }
  };
  
  const updateMenuItem = async (restaurantId, itemId, updates) => {
    try {
      const updatedRestaurant = await api.updateMenuItem(
        restaurantId,
        itemId,
        updates,
      );
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === updatedRestaurant.id || r._id === updatedRestaurant.id
            ? updatedRestaurant
            : r,
        ),
      );
      showToast("Menu item updated successfully.", "success");
      return updatedRestaurant;
    } catch (err) {
      showToast("Failed to update menu item.", "error");
      throw err;
    }
  };

  const deleteMenuItem = async (restaurantId, itemId) => {
    try {
      const result = await api.deleteMenuItem(restaurantId, itemId);
      // If API returns full restaurant, use it; otherwise update local state
      if (result && result.menuItems) {
        setRestaurants((prev) =>
          prev.map((r) =>
            r.id === result.id || r._id === result.id ? result : r,
          ),
        );
      } else {
        setRestaurants((prev) =>
          prev.map((r) => {
            if (r.id === restaurantId || r._id === restaurantId) {
              return {
                ...r,
                menuItems: (r.menuItems || []).filter(
                  (it) =>
                    (it.id || it._id || it._id?.toString()) !== itemId &&
                    (it.id || it._id) !== itemId,
                ),
              };
            }
            return r;
          }),
        );
      }
      showToast("Menu item deleted successfully.", "success");
      return result;
    } catch (err) {
      showToast("Failed to delete menu item.", "error");
      throw err;
    }
  };

  const updateRestaurantProfile = async (updated) => {
    try {
      const saved = await api.updateRestaurant(updated);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === saved.id ? saved : r)),
      );
      showToast("Restaurant details updated successfully.", "success");
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to update restaurant profile.",
        "error",
      );
      throw err;
    }
  };

  const deleteRestaurant = async (restaurantId) => {
    try {
      await api.deleteRestaurant(restaurantId);
      setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
      showToast("Restaurant deleted successfully.", "success");
    } catch (err) {
      showToast("Failed to delete restaurant.", "error");
      throw err;
    }
  };

  const toggleRestaurantVisibility = async (restaurantId) => {
    try {
      const updated = await api.toggleRestaurantStatus(restaurantId);
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === restaurantId || r._id === restaurantId
            ? { ...r, isActive: updated.isActive }
            : r,
        ),
      );
      const status = updated.isActive ? "activated" : "deactivated";
      showToast(`Restaurant ${status} successfully.`, "success");
      return updated;
    } catch (err) {
      showToast("Failed to toggle restaurant status.", "error");
      throw err;
    }
  };

  const clearRestaurantReport = async (restaurantId) => {
    try {
      const updated = await api.removeRestaurantReport(restaurantId);
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === restaurantId || r._id === restaurantId
            ? { ...r, reported: updated.reported || false }
            : r,
        ),
      );
      showToast("Report cleared successfully.", "success");
      return updated;
    } catch (err) {
      showToast("Failed to clear restaurant report.", "error");
      throw err;
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (error) {
      console.error(error);
    }
  };

  const updateUserProfile = async (payload) => {
    try {
      const updated = await api.updateProfile(payload);
      setProfile(updated);

      showToast("Profile updated successfully", "success");

      return updated;
    } catch (error) {
      showToast("Failed to update profile", "error");
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchUserRole,
        restaurants,
        reservations,
        ownerReservations,
        adminReservations,
        adminReviews,
        isLoading,
        setIsProfileModalOpen,
        isProfileModalOpen,
        closeProfileModal,
        openProfileModal,
        profile,
        fetchProfile,
        updateUserProfile,
        refreshRestaurants,
        fetchAdminRestaurantsByStatus,
        fetchAdminReservations,
        updateAdminReservationStatus,
        fetchAdminReviews,
        deleteAdminReview,
        replyAdminReview,
        refreshReservations,
        fetchOwnerReservations,
        addNewReservation,
        retryReservationPayment,
        updateReservationInState,
        cancelUserReservation,
        updateUserReservation,
        changeBookingStatus,
        submitRestaurantReview,
        createRestaurant,
        updateRestaurantProfile,
        deleteRestaurant,
        toggleRestaurantVisibility,
        clearRestaurantReport,
        uploadRestaurantGallery,
        addMenuItem,
        toast,
        showToast,
        hideToast,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        setAuthModalTab,
        login,
        signup,
        forgotPassword,
        logout,
        updateMenuItem,
        deleteMenuItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
