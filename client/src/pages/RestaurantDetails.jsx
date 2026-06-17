/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RatingStars } from '../components/RatingStars';
import { SuccessModal } from '../components/SuccessModal';
import { api } from '../api';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  Users,
  MessageSquareCode,
  Sparkles,
  Phone,
  Mail,
  Flame,
  CheckCircle,
  XCircle,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, addNewReservation, submitRestaurantReview, showToast, openAuthModal } = useApp();

  // Local Component States
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuCategory, setActiveMenuCategory] = useState('Mains');

  // Reservation form states
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingGuests, setBookingGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [createdReservation, setCreatedReservation] = useState(null);

  // Review submission form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch individual restaurant details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const fetched = await api.getRestaurantById(id);
        if (fetched) {
          setRestaurant(fetched);
          const reviewItems = await api.getReviewsByRestaurantId(id);
          setReviews(reviewItems);
        } else {
          showToast('Restaurant not found.', 'error');
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, navigate, showToast]);

  // Restrict calendar selector to today or future
  const todayDateStr = useMemo(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Preset time slots (with simulated occupancy)
  const timeSlots = useMemo(() => {
    return [
      { time: '12:00 PM', isFull: false },
      { time: '1:30 PM', isFull: true }, // Simulated booked slot
      { time: '5:00 PM', isFull: false },
      { time: '6:30 PM', isFull: false },
      { time: '7:30 PM', isFull: false },
      { time: '8:30 PM', isFull: true }, // Simulated booked slot
      { time: '9:30 PM', isFull: false }
    ];
  }, []);

  // Filter categorised menu items
  const menuMap = useMemo(() => {
    if (!restaurant) return { Appetizers: [], Mains: [], Desserts: [], Drinks: [] };
    const initial = { Appetizers: [], Mains: [], Desserts: [], Drinks: [] };
    if (restaurant.menu && Array.isArray(restaurant.menu)) {
      restaurant.menu.forEach(item => {
        if (initial[item.category]) {
          initial[item.category].push(item);
        }
      });
    }
    return initial;
  }, [restaurant]);

  // Handle Reservation creation
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    if (!bookingDate) {
      showToast('Please select a dining date.', 'error');
      return;
    }
    if (!bookingTime) {
      showToast('Please select a time slot.', 'error');
      return;
    }
    if (!customerPhone) {
      showToast('Please enter your contact phone number.', 'error');
      return;
    }

    try {
      setBookingLoading(true);
      const bookingData = {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantCuisine: restaurant.cuisine,
        restaurantImage: restaurant.image,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        customerPhone: customerPhone,
        date: bookingDate,
        time: bookingTime,
        guests: bookingGuests,
        specialRequests: specialRequests
      };

      const result = await addNewReservation(bookingData);
      setCreatedReservation(result);
      
      // Reset choices
      setBookingTime('');
      setSpecialRequests('');
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    if (!reviewTitle.trim()) {
      showToast('Please write a title for your review.', 'error');
      return;
    }
    if (!reviewContent.trim()) {
      showToast('Please write the body details for your review.', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const reviewPayload = {
        restaurantId: restaurant.id,
        reviewerName: currentUser.name,
        reviewerEmail: currentUser.email,
        rating: reviewRating,
        title: reviewTitle,
        content: reviewContent
      };

      const completedReview = await submitRestaurantReview(reviewPayload);
      setReviews(prev => [completedReview, ...prev]);

      // Refetch restaurant detail dynamically to update the global aggregate reviews
      const updatedRest = await api.getRestaurantById(restaurant.id);
      if (updatedRest) {
        setRestaurant(updatedRest);
      }

      // Reset Form fields
      setReviewRating(5);
      setReviewTitle('');
      setReviewContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const calculatedRatingAverages = useMemo(() => {
    if (reviews.length === 0) return { stars5: 0, stars4: 0, stars3: 0, stars2: 1 };
    const groups = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    reviews.forEach(r => {
      const bucket = Math.round(r.rating).toString();
      if (groups[bucket] !== undefined) groups[bucket]++;
    });
    const len = reviews.length;
    return {
      stars5: Math.round((groups['5'] / len) * 100),
      stars4: Math.round((groups['4'] / len) * 100),
      stars3: Math.round((groups['3'] / len) * 100),
      starsRemainder: Math.round(((groups['2'] + groups['1']) / len) * 100)
    };
  }, [reviews]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center" id="details-view-loader">
        <div className="w-12 h-12 border-4 border-zinc-955 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 font-bold text-sm">Consulting restaurant specifications...</p>
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="bg-zinc-50 min-h-screen py-10" id={`details-view-rest-${restaurant.id}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-550 hover:text-zinc-950 transition-colors text-xs font-bold uppercase tracking-wider mb-6 group bg-white border border-zinc-200 py-2.5 px-4 rounded-xl shadow-xs"
          id="back-explore-btn"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Explore</span>
        </Link>

        {/* Dynamic Collage Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10" id="collage-gallery">
          <div className="md:col-span-2 aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden shadow-xs border border-zinc-250 bg-zinc-200">
            <img src={restaurant.restaurantImage || restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-4">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xs border border-zinc-250 bg-zinc-200">
              <img src={(restaurant.gallery && restaurant.gallery[0]) || restaurant.image} alt="Restaurant dining angle" className="w-full h-full object-cover" />
            </div>
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xs border border-zinc-250 bg-zinc-200">
              <img src={(restaurant.gallery && restaurant.gallery[1]) || restaurant.image} alt="Restaurant detail close-up" className="w-full h-full object-cover" />
              {restaurant.gallery && restaurant.gallery.length > 2 && (
                <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center text-white text-xs font-extrabold uppercase tracking-widest pointer-events-none">
                  + {restaurant.gallery.length - 2} photos
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Left Core content ↔ Right Booking Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start" id="split-layout-grid">
          {/* LEFT 2-COLUMNS: INFO, MENU, REVIEWS */}
          <div className="lg:col-span-2 space-y-10" id="left-info-column">
            
            {/* Restaurant Profile summary card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm" id="restaurant-about-card">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  {restaurant.cuisine}
                </span>
                <span className="bg-indigo-50 text-indigo-905 border border-indigo-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Sparkles size={11} className="fill-indigo-400 text-indigo-500 animate-pulse" />
                  <span>Verified Venue</span>
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
                {restaurant.name}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-slate-500 text-xs font-semibold mb-6">
                <div className="flex items-center gap-1 text-slate-900">
                  <span className="font-bold text-indigo-600 text-base flex items-center gap-0.5">
                    ★ {restaurant.rating}
                  </span>
                  <span className="text-slate-500">({restaurant.ratingCount} Diner reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{restaurant.address}</span>
                </div>
              </div>

              <p className="text-slate-650 text-sm leading-relaxed mb-6 font-semibold">
                {restaurant.description}
              </p>

              {/* Special features pills */}
              <div className="border-t border-slate-101 pt-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Property Amenities & Extras:</h4>
                <div className="flex flex-wrap gap-2">
                  {restaurant.features && Array.isArray(restaurant.features) && restaurant.features.length > 0 ? (
                    restaurant.features.map((feat, idx) => (
                      <span key={idx} className="bg-slate-50 text-slate-700 border border-slate-150 text-xs font-semibold py-1.5 px-3 rounded-xl">
                        {feat}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs">No features added yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Restaurant Menu Showcase */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm" id="restaurant-menu-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Chef Specials & Menu Highlights</h3>
                  <p className="text-slate-405 text-[11px] font-semibold">Seasonal catalog preview selection</p>
                </div>

                {/* Categories Tab Selector */}
                <div className="flex gap-1 overflow-x-auto max-w-full pb-1 scrollbar-none" id="menu-categories-pills">
                  {['Appetizers', 'Mains', 'Desserts', 'Drinks'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveMenuCategory(cat)}
                      className={`text-xs font-extrabold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                        activeMenuCategory === cat
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-205 text-slate-500 hover:text-indigo-650 hover:bg-indigo-50/50'
                      }`}
                      id={`menu-cat-pill-${cat}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorised Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="menu-items-grid">
                {menuMap[activeMenuCategory] && menuMap[activeMenuCategory].length > 0 ? (
                  menuMap[activeMenuCategory].map(item => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-zinc-150 bg-zinc-50/50 hover:bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                      id={`menu-item-${item.id}`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                            {item.name}
                            {item.isPopular && (
                              <span className="bg-rose-50 text-rose-605 border border-rose-100 text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 uppercase tracking-wide">
                                <Flame size={9} className="fill-rose-500 text-rose-500" />
                                <span>Fav</span>
                              </span>
                            )}
                          </h4>
                          <span className="font-mono text-zinc-900 font-extrabold text-sm">${item.price}</span>
                        </div>
                        <p className="text-zinc-505 text-xs leading-relaxed font-semibold">{item.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-400 text-xs italic py-4 col-span-2 text-center">No seasonal items posted in this category.</p>
                )}
              </div>
            </div>

            {/* REVIEW MANAGEMENT HOUSING */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm" id="reviews-housing-section">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6">User Reviews & Star Aggregate</h3>

              {/* aggregate scores panel block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl mb-8" id="ratings-dashboard">
                <div className="text-center md:border-r border-slate-200 py-2 flex flex-col justify-center">
                  <span className="block text-4xl font-black text-slate-900 leading-none mb-1.5">
                    {restaurant.rating}
                  </span>
                  <div className="flex justify-center mb-1">
                    <RatingStars rating={restaurant.rating} size={15} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Out of 5 stars
                  </span>
                </div>

                <div className="md:col-span-2 space-y-2 text-xs" id="rating-ratio-bars">
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right font-medium text-slate-550 font-semibold">5 star</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-650 rounded-full" style={{ width: `${calculatedRatingAverages.stars5}%` }}></div>
                    </div>
                    <span className="w-8 text-slate-400 font-bold text-right">{calculatedRatingAverages.stars5}%</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right font-medium text-slate-550 font-semibold">4 star</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-650 rounded-full" style={{ width: `${calculatedRatingAverages.stars4}%` }}></div>
                    </div>
                    <span className="w-8 text-slate-400 font-bold text-right">{calculatedRatingAverages.stars4}%</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right font-medium text-slate-550 font-semibold">3 star</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-650 rounded-full" style={{ width: `${calculatedRatingAverages.stars3}%` }}></div>
                    </div>
                    <span className="w-8 text-slate-400 font-bold text-right">{calculatedRatingAverages.stars3}%</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right font-medium text-slate-550 font-semibold">2 star &lt;</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-650 rounded-full" style={{ width: `${calculatedRatingAverages.starsRemainder}%` }}></div>
                    </div>
                    <span className="w-8 text-slate-400 font-bold text-right">{calculatedRatingAverages.starsRemainder}%</span>
                  </div>
                </div>
              </div>

              {/* Review submit form */}
              <div className="mb-10 pb-10 border-b border-slate-200" id="submission-review-box">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Post a Dining Experience Review</h4>
                
                {currentUser ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Rating Score</label>
                      <RatingStars rating={reviewRating} size={22} interactive={true} onChange={setReviewRating} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">Active Critic Name</label>
                        <input
                          type="text"
                          disabled
                          value={currentUser.name}
                          className="w-full bg-slate-100 border border-slate-200 text-slate-550 rounded-xl py-2.5 px-3.5 text-xs font-extrabold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Review Title</label>
                        <input
                          type="text"
                          placeholder="Summarize your main highlight (e.g. Unforgettable dry aged ribeye!)"
                          value={reviewTitle}
                          onChange={e => setReviewTitle(e.target.value)}
                          className="w-full bg-white border border-slate-205 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900"
                          id="review-title-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Review Commentary details</label>
                      <textarea
                        rows={4}
                        placeholder="Share your detailed impressions with our dining community of flavor, ambiance, plating and chef service..."
                        value={reviewContent}
                        onChange={e => setReviewContent(e.target.value)}
                        className="w-full bg-white border border-slate-205 rounded-xl py-3 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 leading-relaxed"
                        id="review-commentary-input"
                      ></textarea>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl hover:shadow-md transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        id="review-submit-btn"
                      >
                        <span>Publish Feedback Review</span>
                        {submittingReview && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center" id="review-logout-fallback">
                    <p className="text-slate-500 text-xs mb-4">You must be logged in to compile star reviews or critiques for this restaurant.</p>
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="px-4.5 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                    >
                      Authenticate to Review
                    </button>
                  </div>
                )}
              </div>

              {/* Reviews stream list */}
              <div className="space-y-6" id="reviews-stream-feed">
                {reviews.length > 0 ? (
                  reviews.map(rev => (
                    <div key={rev.id} className="pb-5 border-b border-zinc-100 last:pb-0 last:border-none" id={`review-entry-${rev.id}`}>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900 leading-tight mb-1">{rev.title}</h4>
                          <div className="flex items-center gap-2">
                            <RatingStars rating={rev.rating} size={11} />
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                              Published {new Date(rev.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Critic avatar profile icon */}
                        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg">
                          <span className="text-[9px] font-extrabold text-zinc-650 tracking-wide uppercase truncate max-w-[90px]">
                            {rev.reviewerName}
                          </span>
                        </div>
                      </div>
                      <p className="text-zinc-655 text-xs leading-relaxed pl-1 font-semibold">
                        "{rev.content}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-zinc-400 text-xs italic font-semibold" id="empty-reviews">
                    Be the very first critical critic to publish an aggregate review star feedback.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT VIEW COLUMN: TABLE BOOKING CHASSIS */}
          <div className="lg:sticky lg:top-24 space-y-6" id="right-booking-column">
            <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-2xl relative" id="table-reservation-form-container">
              
              <div className="absolute top-4 right-4 bg-indigo-950/65 border border-indigo-900/40 text-[10px] font-bold text-indigo-400 py-1 px-3 rounded-full flex items-center gap-1">
                <Clock size={11} />
                <span>Instant Confirmation</span>
              </div>

              <h3 className="text-lg font-black tracking-tight mb-5 mt-2 flex items-center gap-2">
                <span>Book Table Seatings</span>
              </h3>

              {currentUser ? (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Pre-fill User Card Display */}
                  <div className="bg-slate-955/40 border border-slate-855 rounded-2xl p-3.5 flex items-center gap-3 bg-indigo-950/15">
                    <div className="w-8 h-8 rounded-full bg-slate-850 flex items-center justify-center text-slate-200 font-bold text-xs uppercase border border-slate-705">
                      {currentUser.name[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9px] text-indigo-400 font-bold uppercase tracking-widest leading-none">Dining Account</span>
                      <span className="block text-xs font-bold mt-1 truncate max-w-[170px]">{currentUser.name}</span>
                    </div>
                  </div>

                  {/* Date Grid */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Select Date
                    </label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        min={todayDateStr}
                        value={bookingDate}
                        onChange={e => setBookingDate(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-white select-none relative custom-calendar-field transition-all"
                        id="booking-date-field"
                      />
                    </div>
                  </div>

                  {/* Party Guest Size select */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Number of Guests
                    </label>
                    <div className="relative">
                      <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={bookingGuests}
                        onChange={e => setBookingGuests(parseInt(e.target.value))}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-white cursor-pointer transition-all"
                        id="booking-guests-field"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n} className="bg-slate-900 text-white font-semibold">
                            {n} {n === 1 ? 'Guest Seat' : 'Guests Seating'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Phone Contact details */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Mobile Phone contact
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-white transition-all"
                        id="booking-phone-field"
                      />
                    </div>
                  </div>

                  {/* Time selector Slots */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Available Time Spots
                    </label>
                    
                    <div className="grid grid-cols-3 gap-1.5" id="booking-time-grid">
                      {timeSlots.map(slot => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={slot.isFull}
                          onClick={() => setBookingTime(slot.time)}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            slot.isFull
                              ? 'bg-slate-950/20 border-slate-800 text-slate-600 line-through cursor-not-allowed'
                              : bookingTime === slot.time
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md font-extrabold scale-102 shadow-indigo-900/30'
                              : 'bg-slate-950/50 border border-slate-800 text-slate-300 hover:border-indigo-505 hover:text-white'
                          }`}
                          id={`time-pills-${slot.time.replace(':', '_').replace(' ', '_')}`}
                        >
                          <span>{slot.time}</span>
                          <span className={`text-[8px] font-bold leading-none ${slot.isFull ? 'text-slate-650' : bookingTime === slot.time ? 'text-indigo-250 font-bold' : 'text-slate-500'}`}>
                            {slot.isFull ? 'Full' : 'Open'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special requests comments */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Special Accommodations details
                    </label>
                    <textarea
                      rows={2}
                      placeholder="E.g. Wheelchair access, outdoor terrace preference, high chair request, nut allergy warnings..."
                      value={specialRequests}
                      onChange={e => setSpecialRequests(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-white leading-relaxed placeholder:text-slate-700 transition-all"
                      id="booking-special-field"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs tracking-wider rounded-xl hover:shadow-lg hover:shadow-indigo-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      id="booking-submit-btn"
                    >
                      <span>SCHEDULE DINING RESERVATION</span>
                      {bookingLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-8 text-center" id="booking-logout-fallback">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-indigo-400 mb-4 border border-slate-700">
                    <Lock size={20} />
                  </div>
                  <h4 className="text-sm font-black text-white tracking-wide uppercase">Table Reservation Locked</h4>
                  <p className="text-slate-400 text-xs my-3 max-w-[220px] mx-auto leading-relaxed font-semibold">
                    You must sign in or register an account to place online fine-dining reservations.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-extrabold text-xs text-white uppercase rounded-xl shadow-lg shadow-indigo-950/30 transition cursor-pointer"
                    id="booking-lock-signin-btn"
                  >
                    Authenticate Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Success Pass Board Modal Popup */}
        <SuccessModal
          reservation={createdReservation}
          onClose={() => setCreatedReservation(null)}
        />
      </div>
    </div>
  );
};
