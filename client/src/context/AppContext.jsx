/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { api } from "../api";

const API_URL = import.meta.env.VITE_API_URL;

const AppContext = createContext(undefined);

const normalizeRole = (r) => {
  if (!r) return "user";
  const map = {
    customer: "user",
    owner: "restaurant_owner",
    restaurant_owner: "restaurant_owner",
    user: "user",
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
    const saved = localStorage.getItem("dineflow_current_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      name: "Marcus Sterling",
      email: "marcus@sterling.co",
      role: "customer",
    };
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
    ];
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [authModalTab, setAuthModalTab] = useState("login");
  const [restaurants, setRestaurants] = useState([]);
  const [reservations, setReservations] = useState([]);
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

      if (result.token) {
        localStorage.setItem("dineflow_token", result.token);
      }

      const payload = result.data || {};
      const userEmail = payload.email || email.toLowerCase().trim();
      const role = payload.role || "customer";
      const name =
        payload.username || payload.name || deriveNameFromEmail(userEmail);
      setCurrentUser({ name, email: userEmail, role });
      showToast(result.message || `Welcome back, ${name}!`, "success");
      const profileData = await api.getProfile();
      setIsAuthModalOpen(false);

      setProfile(profileData);
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
      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          username: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          role,
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

      const payload = result.data || {};
      const userEmail = payload.email || email.toLowerCase().trim();
      const userRole = payload.role || role || "customer";
      const userName =
        payload.username ||
        payload.name ||
        name.trim() ||
        deriveNameFromEmail(userEmail);
      setCurrentUser({ name: userName, email: userEmail, role: userRole });
      showToast(
        result.message ||
          `Account successfully registered! Welcome, ${userName}.`,
        "success",
      );
      setIsAuthModalOpen(false);
      return true;
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
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsLoading(false);

    if (!email) {
      showToast("Please enter your email address.", "error");
      return false;
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = registeredUsers.find(
      (u) => u.email.toLowerCase() === trimmedEmail,
    );

    if (user) {
      showToast(
        `A password recovery code has been sent to ${trimmedEmail}!`,
        "success",
      );
      return true;
    } else {
      showToast(
        "Email address not found. Please double-check or Create an Account.",
        "error",
      );
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("dineflow_token");
    setCurrentUser(null);
    showToast("Successfully signed out of profile.", "info");
  };

  const refreshRestaurants = async () => {
    const list = await api.getRestaurants();
    setRestaurants(list);
  };

  const refreshReservations = async () => {
    const list = await api.getReservations();
    setReservations(list);
  };

  const addNewReservation = async (res) => {
    try {
      const created = await api.createReservation(res);
      setReservations((prev) => [created, ...prev]);
      showToast("Reservation confirmed successfully!", "success");
      return created;
    } catch (err) {
      showToast(err.message || "Failed to make reservation", "error");
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
      showToast("Failed to cancel reservation.", "error");
    }
  };

  const changeBookingStatus = async (id, status) => {
    try {
      const updated = await api.updateReservationStatus(id, status);
      setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      showToast(`Reservation status updated to ${status}.`, "success");
    } catch (err) {
      showToast("Failed to update status.", "error");
    }
  };

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

  const updateRestaurantProfile = async (updated) => {
    try {
      const saved = await api.updateRestaurant(updated);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === saved.id ? saved : r)),
      );
      showToast("Restaurant details updated successfully.", "success");
    } catch (err) {
      showToast("Failed to update restaurant profile.", "error");
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
        isLoading,
        setIsProfileModalOpen,
        closeProfileModal,
        openProfileModal,
        profile,
        fetchProfile,
        updateUserProfile,
        refreshRestaurants,
        refreshReservations,
        addNewReservation,
        cancelUserReservation,
        changeBookingStatus,
        submitRestaurantReview,
        updateRestaurantProfile,
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
