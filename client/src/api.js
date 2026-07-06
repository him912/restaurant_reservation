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

const getStoredCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("dineflow_current_user") || "null");
  } catch {
    return null;
  }
};

const normalizeReservation = (reservation) => {
  if (!reservation) return null;
  const id = reservation._id || reservation.id;
  const restaurantId =
    reservation.restaurantId?._id ||
    reservation.restaurantId?.id ||
    reservation.restaurantId ||
    "";
  const restaurant = reservation.restaurantId || {};
  const storedCurrentUser = getStoredCurrentUser();
  const partySize = Number(
    reservation.partySize || reservation.guests || reservation.party_size || 0,
  );
  const fallbackCustomerName =
    reservation.customerName ||
    reservation.customerFullName ||
    storedCurrentUser?.name ||
    reservation.userId?.username ||
    reservation.userId?.name ||
    "";
  const fallbackCustomerEmail =
    reservation.customerEmail ||
    storedCurrentUser?.email ||
    reservation.userId?.email ||
    "";

  return {
    ...reservation,
    id,
    restaurantId,
    restaurantName: reservation.restaurantName || restaurant.name || "",
    restaurantCuisine: reservation.restaurantCuisine || restaurant.cuisine || "",
    restaurantImage: reservation.restaurantImage || restaurant.image || "",
    customerName: fallbackCustomerName,
    customerEmail: fallbackCustomerEmail,
    customerPhone: reservation.customerPhone || "",
    partySize,
    guests: partySize,
    status:
      reservation.status === "reserved"
        ? "confirmed"
        : reservation.status || "pending",
    specialRequests: reservation.specialRequests || "",
    tableNumber: reservation.tableNumber || null,
    date:
      typeof reservation.date === "string"
        ? reservation.date
        : reservation.date instanceof Date
        ? reservation.date.toISOString().split("T")[0]
        : reservation.date
        ? new Date(reservation.date).toISOString().split("T")[0]
        : "",
  };
};

const mapStatusToApi = (status) => {
  if (status === "confirmed") return "reserved";
  return status;
};

const formatTimeForApi = (time) => {
  if (!time) return "";
  const raw = String(time).trim();

  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [hours, minutes] = raw.split(":");
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return raw;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
      const response = await axios.get(`${API_URL}/restaurants/`, getAuthConfig());
      console.log("Fetched restaurants from backend:", response.data);
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
    const restaurantId = updated.id || updated._id;
    const payload = { ...updated };
    delete payload.id;
    delete payload._id;

    try {
      const response = await axios.put(
        `${API_URL}/restaurants/${restaurantId}`,
        payload,
        getAuthConfig(),
      );
      return response.data?.data || response.data;
    } catch (err) {
      console.error("Failed to update restaurant via backend:", err);
      await delay(400);
      const data = localStorage.getItem("restaurant_platform_restaurants");
      if (!data) throw err;
      const list = JSON.parse(data);
      const idx = list.findIndex((r) => r.id === restaurantId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updated };
        localStorage.setItem(
          "restaurant_platform_restaurants",
          JSON.stringify(list),
        );
        return list[idx];
      }
      throw err;
    }
  },

  createRestaurant: async (restaurantData) => {
    try {
      let config = getAuthConfig();
      let payload = restaurantData;

      if (restaurantData.restaurantImage instanceof File) {
        payload = new FormData();
        payload.append("name", restaurantData.name);
        payload.append("description", restaurantData.description);
        payload.append("cuisineType", JSON.stringify(restaurantData.cuisineType || []));
        payload.append("address", restaurantData.address);
        payload.append("city", restaurantData.city);
        payload.append("phone", restaurantData.phone);
        payload.append("email", restaurantData.email);
        payload.append("website", restaurantData.website);
        payload.append("capacity", restaurantData.capacity);
        payload.append("openingTime", restaurantData.openingTime);
        payload.append("closingTime", restaurantData.closingTime);
        payload.append("priceRange", restaurantData.priceRange);
        payload.append("features", JSON.stringify(restaurantData.features || []));
        payload.append("restaurantImage", restaurantData.restaurantImage);

        config = {
          headers: {
            ...getAuthHeaders(),
          },
          maxBodyLength: Infinity,
        };
      }

      const response = await axios.post(
        `${API_URL}/restaurants`,
        payload,
        config,
      );
      return response.data?.data || response.data;
    } catch (err) {
      console.error("Failed to create restaurant via backend:", err);
      await delay(400);
      const data = localStorage.getItem("restaurant_platform_restaurants");
      const current = data ? JSON.parse(data) : [];
      const newRestaurant = {
        ...restaurantData,
        id: `rest-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      current.unshift(newRestaurant);
      localStorage.setItem(
        "restaurant_platform_restaurants",
        JSON.stringify(current),
      );
      return newRestaurant;
    }
  },

  deleteRestaurant: async (restaurantId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/restaurants/${restaurantId}`,
        getAuthConfig(),
      );
      return response.data?.data || response.data;
    } catch (err) {
      console.error("Failed to delete restaurant via backend:", err);
      await delay(400);
      const data = localStorage.getItem("restaurant_platform_restaurants");
      if (!data) throw err;
      const current = JSON.parse(data).filter((r) => r.id !== restaurantId);
      localStorage.setItem(
        "restaurant_platform_restaurants",
        JSON.stringify(current),
      );
      return { id: restaurantId };
    }
  },

  uploadRestaurantGallery: async (restaurantId, files = []) => {
    if (!restaurantId) {
      throw new Error("restaurantId is required");
    }

    const formData = new FormData();
    (files || []).slice(0, 10).forEach((file) => {
      if (file) {
        formData.append("images", file);
      }
    });

    try {
      const response = await axios.post(
        `${API_URL}/restaurants/own/gallery/${restaurantId}`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
          },
          maxBodyLength: Infinity,
        },
      );
      return response.data?.data || response.data;
    } catch (err) {
      console.error("Failed to upload gallery images:", err);
      throw err;
    }
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
    try {
      const response = await axios.get(
        `${API_URL}/reservations/my`,
        getAuthConfig(),
      );
      const reservations = response.data?.data || [];
      return Array.isArray(reservations)
        ? reservations.map(normalizeReservation)
        : [];
    } catch (err) {
      console.error("Failed to fetch reservations from backend:", err);
      await delay(300);
      const data = localStorage.getItem("restaurant_platform_reservations");
      return data ? JSON.parse(data) : [];
    }
  },

  getReservationsForRestaurant: async (restaurantId) => {
    await delay(250);
    const data = localStorage.getItem("restaurant_platform_reservations");
    if (!data) return [];
    const list = JSON.parse(data);
    return list.filter((r) => r.restaurantId === restaurantId);
  },

  createReservation: async (res) => {


    const payload = {
      restaurantId: res.restaurantId,
      date: res.date,
      time: formatTimeForApi(res.time),
      partySize: res.partySize ?? res.guests ?? 1,
    };

    console.log("Creating reservation with payload:", payload);

    try {
      const response = await axios.post(
        `${API_URL}/reservations`,
        payload,
        getAuthConfig(),
      );
      const created = normalizeReservation(response.data?.data || response.data);
      return {
        ...created,
        restaurantId: res.restaurantId || created.restaurantId,
        restaurantName: res.restaurantName || created.restaurantName,
        restaurantCuisine: res.restaurantCuisine || created.restaurantCuisine,
        restaurantImage: res.restaurantImage || created.restaurantImage || res.image || "",
        customerName: res.customerName || created.customerName,
        customerEmail: res.customerEmail || created.customerEmail,
        customerPhone: res.customerPhone || created.customerPhone,
        guests: res.guests || res.partySize || created.guests,
        partySize: res.partySize ?? res.guests ?? created.partySize ?? 1,
        specialRequests: res.specialRequests || created.specialRequests,
      };
    } catch (err) {
      console.error("Failed to create reservation via backend:", err);
      await delay(500);
      const data = localStorage.getItem("restaurant_platform_reservations");
      const list = data ? JSON.parse(data) : [];

      const newRes = {
        ...res,
        partySize: res.partySize ?? res.guests ?? 1,
        guests: res.guests ?? res.partySize ?? 1,
        restaurantImage: res.restaurantImage || res.image || "",
        id: `res-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        tableNumber: Math.floor(1 + Math.random() * 20),
      };

      list.unshift(newRes);
      localStorage.setItem(
        "restaurant_platform_reservations",
        JSON.stringify(list),
      );
      return newRes;
    }
  },

  updateReservation: async (id, update) => {
    const payload = {
      ...(update.restaurantId ? { restaurantId: update.restaurantId } : {}),
      ...(update.date ? { date: update.date } : {}),
      ...(update.time ? { time: update.time } : {}),
      ...(update.guests ? { partySize: update.guests } : {}),
      ...(update.partySize ? { partySize: update.partySize } : {}),
      ...(update.status ? { status: mapStatusToApi(update.status) } : {}),
    };

    try {
      const response = await axios.put(
        `${API_URL}/reservations/${id}`,
        payload,
        getAuthConfig(),
      );
      return normalizeReservation(response.data?.data || response.data);
    } catch (err) {
      console.error("Failed to update reservation via backend:", err);
      await delay(350);
      const data = localStorage.getItem("restaurant_platform_reservations");
      if (!data) throw err;
      const list = JSON.parse(data);
      const idx = list.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("Reservation not found");
      list[idx] = {
        ...list[idx],
        ...update,
        status: update.status || list[idx].status,
      };
      localStorage.setItem(
        "restaurant_platform_reservations",
        JSON.stringify(list),
      );
      return list[idx];
    }
  },

  updateReservationStatus: async (id, status) => {
    const apiStatus = mapStatusToApi(status);

    try {
      if (status === "cancelled") {
        return api.cancelReservation(id);
      }

      const response = await axios.put(
        `${API_URL}/reservations/${id}`,
        { status: apiStatus },
        getAuthConfig(),
      );
      return normalizeReservation(response.data?.data || response.data);
    } catch (err) {
      console.error("Failed to update reservation status via backend:", err);
      await delay(350);
      const data = localStorage.getItem("restaurant_platform_reservations");
      if (!data) throw err;
      const list = JSON.parse(data);
      const idx = list.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("Reservation not found");
      list[idx].status = status;
      localStorage.setItem(
        "restaurant_platform_reservations",
        JSON.stringify(list),
      );
      return list[idx];
    }
  },

  cancelReservation: async (id) => {
    try {
      await axios.delete(
        `${API_URL}/reservations/${id}`,
        getAuthConfig(),
      );
      return { id, status: "cancelled" };
    } catch (err) {
      console.error("Failed to cancel reservation via backend:", err);
      await delay(350);
      const data = localStorage.getItem("restaurant_platform_reservations");
      if (!data) return { id, status: "cancelled" };
      const list = JSON.parse(data);
      const idx = list.findIndex((r) => r.id === id);
      if (idx !== -1) {
        list[idx].status = "cancelled";
        localStorage.setItem(
          "restaurant_platform_reservations",
          JSON.stringify(list),
        );
        return list[idx];
      }
      return { id, status: "cancelled" };
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
