/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { RatingStars } from "./RatingStars";
import { MapPin, ArrowRight } from "lucide-react";

export const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();
  const { currentUser, openAuthModal } = useApp();

  const isStaffUser =
    currentUser?.role === "admin" ||
    currentUser?.role === "restaurant_owner" ||
    currentUser?.role === "owner";

  // Convert Pricing symbol into visible tiers
  const renderPrice = (p) => {
    return (
      <span
        className="font-mono text-xs font-semibold"
        title={`Price Level: ${p}`}
      >
        <span className="text-zinc-900 font-bold">{p}</span>
        <span className="text-zinc-300">{"§§§§".slice(p.length)}</span>
      </span>
    );
  };

  // Get primary cuisine type
  const primaryCuisine = Array.isArray(restaurant.cuisineType)
    ? restaurant.cuisineType[0]
    : restaurant.cuisineType || "Cuisine";

  const handleCardAction = (event) => {
    event.preventDefault();

    // Admins and owners can only view the restaurant, not book
    if (isStaffUser) {
      navigate(`/restaurant/${restaurant._id || restaurant.id}`);
      return;
    }

    if (!currentUser) {
      openAuthModal("login");
      return;
    }

    navigate(`/restaurant/${restaurant._id || restaurant.id}`);
  };

  return (
    <div
      className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
      id={`restaurant-card-${restaurant._id}`}
    >
      {/* Restaurant Image Header */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={restaurant.restaurantImage}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-xl shadow-sm uppercase tracking-wider">
            {primaryCuisine}
          </span>
        </div>
      </div>

      {/* Restaurant Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating details & Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold bg-indigo-655 text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                {restaurant.rating || "N/A"}
              </span>
              <RatingStars rating={restaurant.rating || 0} size={13} />
              <span className="text-slate-400 text-xs font-medium">
                ({restaurant.reviewCount || 0})
              </span>
            </div>
            {renderPrice(restaurant.priceRange || "§§")}
          </div>

          {/* Restaurant Title */}
          <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-indigo-650 transition-colors leading-snug mb-1">
            {restaurant.name}
          </h3>

          {/* Location Area */}
          <div className="flex items-center gap-1 text-slate-500 mb-3">
            <MapPin size={13} className="shrink-0 text-slate-400" />
            <span className="text-xs font-medium truncate">
              {restaurant.city || "Location"}
            </span>
          </div>

          {/* Short dynamic description */}
          <p className="text-slate-650 text-xs leading-relaxed line-clamp-2 mb-4">
            {restaurant.description ||
              restaurant.address ||
              "No description available"}
          </p>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Capacity: {restaurant.capacity || "N/A"}
          </span>
          {isStaffUser ? (
            <button
              type="button"
              onClick={handleCardAction}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all text-right py-2 px-3.5 rounded-xl cursor-pointer"
              id={`view-trigger-${restaurant._id || restaurant.id}`}
            >
              <span>View Details</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCardAction}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 group-hover:gap-1.5 transition-all text-right py-2 px-3.5 rounded-xl active:scale-97 cursor-pointer"
              id={`book-trigger-${restaurant._id || restaurant.id}`}
            >
              <span>Book Table</span>
              <ArrowRight size={13} className="text-indigo-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
