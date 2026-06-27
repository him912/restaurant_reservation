/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from "axios";
import {
  INITIAL_RESTAURANTS,
  INITIAL_REVIEWS,
  INITIAL_RESERVATIONS,
} from "./mockData";

// Simulated network latency
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const API_URL = import.meta.env.VITE_API_URL;

// Helper to get auth config for requests
const getAuthConfig = () => {
  // token stored by the app is `dineflow_token` (set in AppContext.login)
  const token = localStorage.getItem("dineflow_token");
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    : { headers: { "Content-Type": "application/json" } };
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("dineflow_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeReview = (review) => {
  if (!review) return null;
  const id = review._id || review.id;
  return {
    ...review,
    id,
    rating: Number(review.rating || 0),
    title: review.reviewName || review.title || review.name || "",
    content: review.comment || review.content || "",
    reviewerName:
      review.userId?.username ||
      review.reviewerName ||
      review.reviewerName ||
      review.name ||
      "",
    date: review.createdAt || review.date || new Date().toISOString(),
    photos: Array.isArray(review.photos) ? review.photos : [],
  };
};

// Helper to initialize Local Storage
const initLocalStorage = () => {
  if (!localStorage.getItem("restaurant_platform_restaurants")) {
    localStorage.setItem(
      "restaurant_platform_restaurants",
      JSON.stringify(INITIAL_RESTAURANTS),
    );
  }
  if (!localStorage.getItem("restaurant_platform_reviews")) {
    localStorage.setItem(
      "restaurant_platform_reviews",
      JSON.stringify(INITIAL_REVIEWS),
    );
  }
  if (!localStorage.getItem("restaurant_platform_reservations")) {
    localStorage.setItem(
      "restaurant_platform_reservations",
      JSON.stringify(INITIAL_RESERVATIONS),
    );
  }
};

// Execute initialization
initLocalStorage();

export const api = {
  // RESTAURANTS
  getRestaurants: async () => {
    try {
      console.log(`Fetching restaurants from backend: ${API_URL}/restaurants/`);
      const response = await axios.get(`${API_URL}/restaurants/`, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Fetched restaurants from backend:", response.data);
      // Extract data array from the nested response structure
      const data = response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Failed to fetch restaurants from backend:", err);
      await delay(350);
      const data = localStorage.getItem("restaurant_platform_restaurants");
      return data ? JSON.parse(data) : [];
    }
  },
  
  getRestaurantById: async (id) => {
    try {
      const response = await axios.get(
        `${API_URL}/restaurants/${id}`,
        getAuthConfig(),
      );
      const data = response.data?.data || response.data;
      return data || null;
    } catch (err) {
      console.error("Failed to fetch restaurant detail from backend:", err);
      await delay(200);
      const data = localStorage.getItem("restaurant_platform_restaurants");
      if (!data) return null;
      const list = JSON.parse(data);
      return list.find((r) => r.id === id) || null;
    }
  },

  updateRestaurant: async (updated) => {
    await delay(400);
    const data = localStorage.getItem("restaurant_platform_restaurants");
    if (!data) throw new Error("Data not found");
    const list = JSON.parse(data);
    const idx = list.findIndex((r) => r.id === updated.id);
    if (idx !== -1) {
      list[idx] = updated;
      localStorage.setItem(
        "restaurant_platform_restaurants",
        JSON.stringify(list),
      );
    }
    return updated;
  },

  // REVIEWS
  getReviewsByRestaurantId: async (restaurantId) => {
    try {
      const response = await axios.get(
        `${API_URL}/reviews/restaurant/${restaurantId}`,
        getAuthConfig(),
      );
      const reviews = response.data?.data || [];
      return Array.isArray(reviews) ? reviews.map(normalizeReview) : [];
    } catch (err) {
      console.error("Failed to fetch reviews from backend:", err);
      await delay(250);
      const data = localStorage.getItem("restaurant_platform_reviews");
      if (!data) return [];
      const list = JSON.parse(data);
      return list.filter((r) => r.restaurantId === restaurantId).map(normalizeReview);
    }
  },

  createReview: async (review, files = []) => {
    try {
      console.log("Creating review with payload:", review, "and files:", files);
      const formData = new FormData();
      formData.append("restaurantId", review.restaurantId);
      formData.append("reviewName", review.reviewName || review.title || "");
      formData.append("rating", review.rating);
      formData.append("comment", review.comment || review.content || "");

      (files || []).slice(0, 2).forEach((file) => {
        formData.append("images", file);
      });

      if (Array.isArray(review.photos)) {
        review.photos.forEach((photo) => {
          if (photo) formData.append("photos", photo);
        });
      }

      const response = await axios.post(`${API_URL}/reviews`, formData, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return normalizeReview(response.data?.data || response.data);
    } catch (err) {
      console.error("Failed to create review:", err);
      throw err;
    }
  },

  updateReview: async (reviewId, review, files = []) => {
    try {
      const formData = new FormData();
      formData.append("reviewName", review.reviewName || review.title || "");
      formData.append("rating", review.rating);
      formData.append("comment", review.comment || review.content || "");

      (files || []).slice(0, 2).forEach((file) => {
        formData.append("images", file);
      });

      if (Array.isArray(review.photos)) {
        review.photos.forEach((photo) => {
          if (photo) formData.append("photos", photo);
        });
      }

      const response = await axios.put(`${API_URL}/reviews/${reviewId}`, formData, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return normalizeReview(response.data?.data || response.data);
    } catch (err) {
      console.error("Failed to update review:", err);
      throw err;
    }
  },

  deleteReview: async (reviewId) => {
    try {
      const response = await axios.delete(`${API_URL}/reviews/${reviewId}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return response.data;
    } catch (err) {
      console.error("Failed to delete review:", err);
      throw err;
    }
  },

  addReview: async (review, files = []) => {
    return api.createReview(review, files);
  },

  // RESERVATIONS
  getReservations: async () => {
    await delay(300);
    const data = localStorage.getItem("restaurant_platform_reservations");
    return data ? JSON.parse(data) : [];
  },

  getReservationsForRestaurant: async (restaurantId) => {
    await delay(250);
    const data = localStorage.getItem("restaurant_platform_reservations");
    if (!data) return [];
    const list = JSON.parse(data);
    return list.filter((r) => r.restaurantId === restaurantId);
  },

  createReservation: async (res) => {
    await delay(500);
    const data = localStorage.getItem("restaurant_platform_reservations");
    const list = data ? JSON.parse(data) : [];

    const newRes = {
      ...res,
      id: `res-${Math.floor(1000 + Math.random() * 9000)}`, // Generates a clean 4-digit booking passcode
      status: "confirmed", // Defaults to confirmed directly for rich immediate testing
      createdAt: new Date().toISOString(),
      tableNumber: Math.floor(1 + Math.random() * 20), // Simulated table assignment
    };

    list.unshift(newRes);
    localStorage.setItem(
      "restaurant_platform_reservations",
      JSON.stringify(list),
    );
    return newRes;
  },

  updateReservationStatus: async (id, status) => {
    await delay(350);
    const data = localStorage.getItem("restaurant_platform_reservations");
    if (!data) throw new Error("No reservoirs found");
    const list = JSON.parse(data);
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Reservation not found");

    list[idx].status = status;
    localStorage.setItem(
      "restaurant_platform_reservations",
      JSON.stringify(list),
    );
    return list[idx];
  },

  cancelReservation: async (id) => {
    await delay(350);
    const data = localStorage.getItem("restaurant_platform_reservations");
    if (!data) return;
    const list = JSON.parse(data);
    const idx = list.findIndex((r) => r.id === id);
    if (idx !== -1) {
      list[idx].status = "cancelled";
      localStorage.setItem(
        "restaurant_platform_reservations",
        JSON.stringify(list),
      );
    }
  },

  // USER PROFILE
getProfile: async () => {
  try {
    const response = await axios.get(
      `${API_URL}/users`,
      getAuthConfig()
    );

    return response.data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
},

updateProfile: async (profileData) => {
  try {
      // Server expects PATCH for partial profile updates
      const response = await axios.patch(
        `${API_URL}/users`,
        profileData,
        getAuthConfig()
      );

    return response.data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
},


};
