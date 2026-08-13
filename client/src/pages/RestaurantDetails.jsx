/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RatingStars } from '../components/RatingStars';
import { SuccessModal } from '../components/SuccessModal';
import { api } from '../api';
import { formatDepositTotal, formatMenuPrice } from '../utils/currency';
import { processReservationPayment } from '../utils/paymentFlow';
import {
  BOOKING_WINDOW_MONTHS,
  getTodayDateString,
  getMaxBookingDateString,
  isPastBookingDate,
  isBeyondBookingWindow,
  isDateWithinBookingWindow,
  isPastBookingSlot,
} from '../utils/bookingDate';
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

const DISPLAY_TIME_SLOTS = [
  '12:00 PM',
  '1:30 PM',
  '5:00 PM',
  '6:30 PM',
  '7:30 PM',
  '8:30 PM',
  '9:30 PM',
];

const displayTimeToApi = (time) => {
  const raw = String(time).trim();
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return raw;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const isValidPhone = (value) => {
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

export const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, reservations, addNewReservation, updateReservationInState, showToast, openAuthModal } = useApp();

  const isStaffUser =
    currentUser?.role === "admin" ||
    currentUser?.role === "restaurant_owner" ||
    currentUser?.role === "owner";
  const canBookTable = Boolean(currentUser) && !isStaffUser;
  const canSubmitReview = Boolean(currentUser) && !isStaffUser;

  // Local Component States
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuCategory, setActiveMenuCategory] = useState('Mains');
  const [paymentConfig, setPaymentConfig] = useState(null);

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
  const [reviewFiles, setReviewFiles] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [responseDrafts, setResponseDrafts] = useState({});
  const [editingResponse, setEditingResponse] = useState(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [reservedByTime, setReservedByTime] = useState({});

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
    api.getPaymentConfig().then(setPaymentConfig).catch(() => {});
  }, [id, navigate, showToast]);

  // Handle Stripe Checkout return (?payment=success|cancelled&reservationId=...)
  useEffect(() => {
    const paymentState = searchParams.get('payment');
    const reservationId = searchParams.get('reservationId');
    if (!paymentState || !reservationId || !currentUser) return;

    const handlePaymentReturn = async () => {
      try {
        if (paymentState === 'success') {
          const verified = await api.verifyPayment(reservationId);
          const enriched = {
            ...verified,
            restaurantName: verified.restaurantName || restaurant?.name || '',
            restaurantCuisine:
              verified.restaurantCuisine ||
              restaurant?.cuisineType?.[0] ||
              restaurant?.cuisine ||
              '',
            restaurantImage:
              verified.restaurantImage ||
              restaurant?.restaurantImage ||
              restaurant?.image ||
              '',
            customerName: currentUser.name,
            customerEmail: currentUser.email,
            guests: verified.partySize || verified.guests,
          };
          setCreatedReservation(enriched);
          showToast(
            verified.paymentStatus === 'paid'
              ? 'Payment successful — reservation submitted for approval.'
              : 'Reservation saved. Payment status is still updating.',
            'success',
          );
        } else if (paymentState === 'cancelled') {
          showToast(
            'Payment cancelled. Your reservation is unpaid and may not be confirmed.',
            'error',
          );
        }
      } catch (err) {
        console.error(err);
        showToast('Could not verify payment status.', 'error');
      } finally {
        setSearchParams({}, { replace: true });
      }
    };

    handlePaymentReturn();
  }, [searchParams, currentUser, restaurant, showToast, setSearchParams]);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!id || !bookingDate) {
        setReservedByTime({});
        return;
      }

      const availability = await api.getRestaurantAvailability(id, bookingDate);
      setReservedByTime(availability?.reservedByTime || {});
    };

    loadAvailability();
  }, [id, bookingDate]);

  const todayDateStr = getTodayDateString();
  const maxBookingDateStr = getMaxBookingDateString();

  const activeRestaurantReservation = useMemo(() => {
    if (!id || !reservations?.length) return null;
    return reservations.find(
      (reservation) =>
        String(reservation.restaurantId) === String(id) &&
        (reservation.status === "pending" || reservation.status === "confirmed"),
    );
  }, [reservations, id]);

  const hasActiveBooking = Boolean(activeRestaurantReservation);

  const handleBookingDateChange = (value) => {
    if (value && isPastBookingDate(value)) {
      showToast('Past dates cannot be selected. Please choose today or a future date.', 'error');
      return;
    }
    if (value && isBeyondBookingWindow(value)) {
      showToast(
        `Bookings can only be made up to ${BOOKING_WINDOW_MONTHS} months in advance.`,
        'error',
      );
      return;
    }
    setBookingDate(value);
    setBookingTime('');
  };

  const timeSlots = useMemo(() => {
    const capacity = Number(restaurant?.capacity) || 20;
    return DISPLAY_TIME_SLOTS.map((time) => {
      const apiTime = displayTimeToApi(time);
      const reservedSeats = Number(reservedByTime[apiTime] || 0);
      const isPast = bookingDate
        ? isPastBookingSlot(bookingDate, apiTime)
        : false;
      return {
        time,
        isFull: reservedSeats + Number(bookingGuests) > capacity,
        isPast,
        isUnavailable: isPast || reservedSeats + Number(bookingGuests) > capacity,
      };
    });
  }, [reservedByTime, bookingGuests, restaurant?.capacity, bookingDate]);

  useEffect(() => {
    if (!bookingTime) return;
    const selectedSlot = timeSlots.find((slot) => slot.time === bookingTime);
    if (selectedSlot?.isUnavailable) {
      setBookingTime('');
    }
  }, [bookingTime, timeSlots]);

  // Filter categorised menu items from restaurant menu data
  const menuMap = useMemo(() => {
    if (!restaurant || !restaurant.menuItems || !Array.isArray(restaurant.menuItems)) return {};
    return restaurant.menuItems.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [restaurant]);

  const menuCategories = useMemo(() => Object.keys(menuMap), [menuMap]);

  useEffect(() => {
    if (menuCategories.length > 0 && !menuCategories.includes(activeMenuCategory)) {
      setActiveMenuCategory(menuCategories[0]);
    }
  }, [menuCategories, activeMenuCategory]);

  // Handle Reservation creation
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    if (isStaffUser) {
      showToast('Admins and restaurant owners cannot make reservations.', 'error');
      return;
    }

    if (!currentUser) {
      showToast('Please log in to make a reservation.', 'error');
      openAuthModal('login');
      return;
    }

    if (!bookingDate) {
      showToast('Please select a dining date.', 'error');
      return;
    }
    if (!isDateWithinBookingWindow(bookingDate)) {
      showToast(
        `Please choose a date between today and ${BOOKING_WINDOW_MONTHS} months from now.`,
        'error',
      );
      return;
    }
    if (hasActiveBooking) {
      showToast(
        'You already have an active reservation at this restaurant. Cancel it from My Reservations before booking again.',
        'error',
      );
      return;
    }
    if (!bookingTime) {
      showToast('Please select a time slot.', 'error');
      return;
    }
    const selectedSlot = timeSlots.find((slot) => slot.time === bookingTime);
    if (selectedSlot?.isPast) {
      showToast('This time slot has already passed. Please choose another.', 'error');
      return;
    }
    if (selectedSlot?.isFull) {
      showToast('That time slot is full. Please choose another.', 'error');
      return;
    }
    if (!customerPhone.trim()) {
      showToast('Please enter your contact phone number.', 'error');
      return;
    }
    if (!isValidPhone(customerPhone)) {
      showToast('Please enter a valid phone number (at least 10 digits).', 'error');
      return;
    }
    if (!bookingGuests || bookingGuests < 1) {
      showToast('Please select at least 1 guest.', 'error');
      return;
    }
    if (bookingGuests > (restaurant.capacity || 20)) {
      showToast(`This restaurant only seats up to ${restaurant.capacity || 20} guests.`, 'error');
      return;
    }

    try {
      setBookingLoading(true);
      const bookingData = {
        restaurantId: id,
        restaurantName: restaurant.name,
        restaurantCuisine: restaurant.cuisine,
        restaurantImage: restaurant.image,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        customerPhone: customerPhone,
        date: bookingDate,
        time: bookingTime,
        partySize: bookingGuests,
        guests: bookingGuests,
        specialRequests: specialRequests
      };

      const result = await addNewReservation(bookingData);

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      if (
        paymentConfig?.enabled &&
        (result?.razorpayOrder || result?.paymentProvider === "razorpay")
      ) {
        const paid = await processReservationPayment({
          reservation: result,
          currentUser: { ...currentUser, phone: customerPhone },
          paymentConfig,
          existingPayment: result.razorpayOrder
            ? {
                razorpayOrder: result.razorpayOrder,
                keyId: result.paymentKeyId,
                provider: result.paymentProvider,
                demoMode: result.paymentDemoMode,
                alreadyPaid: false,
                reservation: result,
              }
            : null,
          onPaid: (updated) => {
            const enriched = {
              ...result,
              ...updated,
              restaurantName: restaurant.name,
              restaurantCuisine:
                restaurant.cuisineType?.[0] || restaurant.cuisine || '',
              restaurantImage: restaurant.restaurantImage || restaurant.image || '',
              customerName: currentUser.name,
              customerEmail: currentUser.email,
              guests: result.guests || result.partySize,
            };
            updateReservationInState(enriched);
            setCreatedReservation(enriched);
            showToast(
              'Payment successful — reservation submitted for approval.',
              'success',
            );
          },
          onFailed: () => {
            updateReservationInState({
              ...result,
              paymentStatus: 'failed',
            });
            showToast(
              'Payment was not completed. Find this booking in My Reservations and tap Pay Now to retry.',
              'error',
            );
          },
        });

        if (!paid) {
          return;
        }
      } else {
        setCreatedReservation(result);
      }
      
      // Reset choices
      setBookingTime('');
      setSpecialRequests('');
      setCustomerPhone('');
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  const resetReviewForm = () => {
    setReviewRating(5);
    setReviewTitle('');
    setReviewContent('');
    setReviewFiles([]);
    setEditingReviewId(null);
  };

  const handleReviewFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 2) {
      showToast('You can upload up to 2 photos per review.', 'error');
      e.target.value = '';
      return;
    }
    setReviewFiles(files);
  };

  const handleReviewEdit = (review) => {
    setEditingReviewId(review.id);
    setReviewRating(review.rating || 5);
    setReviewTitle(review.title || '');
    setReviewContent(review.content || '');
    setReviewFiles([]);
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    if (!id) return;
    try {
      await api.deleteReview(reviewId);
      const updatedReviews = await api.getReviewsByRestaurantId(id);
      setReviews(updatedReviews);
      const updatedRest = await api.getRestaurantById(id);
      if (updatedRest) {
        setRestaurant(updatedRest);
      }
      if (editingReviewId === reviewId) {
        resetReviewForm();
      }
      showToast('Review removed.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete review.', 'error');
    }
  };

  const canManageReview = (review) => {
    if (!currentUser?.id || !review?.authorUserId) return false;
    return String(currentUser.id) === String(review.authorUserId);
  };

  const canReplyToReviews = Boolean(
    restaurant &&
      currentUser &&
      (currentUser.role === "restaurant_owner" || currentUser.role === "owner") &&
      restaurant.ownerId &&
      String(restaurant.ownerId) === String(currentUser.id),
  );

  const handleResponseDraftChange = (reviewId, value) => {
    setResponseDrafts((prev) => ({ ...prev, [reviewId]: value }));
  };

  const handleReviewResponseSubmit = async (reviewId) => {
    const comment = (responseDrafts[reviewId] || '').trim();
    if (!comment) {
      showToast('Please enter a reply before submitting.', 'error');
      return;
    }

    try {
      setSubmittingResponse(true);
      if (editingResponse?.reviewId === reviewId) {
        await api.updateReviewResponse(reviewId, editingResponse.responseId, comment);
        showToast('Reply updated successfully.', 'success');
      } else {
        await api.addReviewResponse(reviewId, comment);
        showToast('Reply published successfully.', 'success');
      }

      const refreshedReviews = await api.getReviewsByRestaurantId(restaurant.id);
      setReviews(refreshedReviews);
      setResponseDrafts((prev) => ({ ...prev, [reviewId]: '' }));
      setEditingResponse(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to save review reply.', 'error');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleReviewResponseEdit = (review, response) => {
    setEditingResponse({ reviewId: review.id, responseId: response._id || response.id });
    setResponseDrafts((prev) => ({ ...prev, [review.id]: response.comment || '' }));
  };

  const handleReviewResponseDelete = async (reviewId, responseId) => {
    if (!window.confirm('Delete this owner reply?')) return;

    try {
      await api.deleteReviewResponse(reviewId, responseId);
      const refreshedReviews = await api.getReviewsByRestaurantId(restaurant.id);
      setReviews(refreshedReviews);
      setEditingResponse((current) => (current?.responseId === responseId ? null : current));
      showToast('Reply removed.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove reply.', 'error');
    }
  };

  // Handle Review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    if (!currentUser) {
      showToast('Please log in to submit a review.', 'error');
      openAuthModal('login');
      return;
    }

    if (isStaffUser) {
      showToast(
        'Admins and restaurant owners cannot post reviews. Reply to customer reviews instead.',
        'error',
      );
      return;
    }

    if (!reviewTitle.trim() || reviewTitle.trim().length < 3) {
      showToast('Please write a review title (at least 3 characters).', 'error');
      return;
    }
    if (!reviewContent.trim() || reviewContent.trim().length < 10) {
      showToast('Please write a review with at least 10 characters.', 'error');
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      showToast('Please select a rating between 1 and 5 stars.', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const reviewPayload = {
        restaurantId: id,
        reviewName: reviewTitle.trim(),
        rating: reviewRating,
        comment: reviewContent.trim(),
        reviewerName: currentUser?.name || '',
        reviewerEmail: currentUser?.email || ''
      };

      const completedReview = editingReviewId
        ? await api.updateReview(editingReviewId, reviewPayload, reviewFiles)
        : await api.createReview(reviewPayload, reviewFiles);

      const updatedReviews = await api.getReviewsByRestaurantId(restaurant.id);
      setReviews(updatedReviews);

      const updatedRest = await api.getRestaurantById(restaurant.id);
      if (updatedRest) {
        setRestaurant(updatedRest);
      }

      resetReviewForm();
      showToast(
        editingReviewId ? 'Your review has been updated.' : 'Your review has been published!',
        'success',
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const calculatedRatingAverages = useMemo(() => {
    const groups = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const bucket = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
      groups[bucket]++;
    });
    const toPercent = (count) =>
      reviews.length === 0 ? 0 : Math.round((count / reviews.length) * 100);
    return {
      stars5: toPercent(groups[5]),
      stars4: toPercent(groups[4]),
      stars3: toPercent(groups[3]),
      stars2: toPercent(groups[2]),
      stars1: toPercent(groups[1]),
    };
  }, [reviews]);

  const ratingDistributionRows = [
    { label: "5 star", percent: calculatedRatingAverages.stars5 },
    { label: "4 star", percent: calculatedRatingAverages.stars4 },
    { label: "3 star", percent: calculatedRatingAverages.stars3 },
    { label: "2 star", percent: calculatedRatingAverages.stars2 },
    { label: "1 star", percent: calculatedRatingAverages.stars1 },
  ];

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
                  {menuCategories.length > 0 ? (
                    menuCategories.map((cat) => (
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
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No menu categories available.</span>
                  )}
                </div>
              </div>

              {/* Categorised Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="menu-items-grid">
                {menuMap[activeMenuCategory] && menuMap[activeMenuCategory].length > 0 ? (
                  menuMap[activeMenuCategory].map(item => (
                    <div
                      key={item.id || item._id}
                      className="overflow-hidden rounded-2xl border border-zinc-150 bg-zinc-50/50 hover:bg-white hover:shadow-md transition-all duration-200"
                      id={`menu-item-${item.id || item._id}`}
                    >
                      {item.image && (
                        <div className="h-40 overflow-hidden bg-zinc-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 flex flex-col justify-between gap-4">
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
                            <span className="font-mono text-zinc-900 font-extrabold text-sm">{formatMenuPrice(item.price, paymentConfig?.currency)}</span>
                          </div>
                          <p className="text-zinc-505 text-xs leading-relaxed font-semibold">{item.description}</p>
                        </div>
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
                  {ratingDistributionRows.map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="w-12 text-right font-semibold text-slate-600 shrink-0">
                        {row.label}
                      </span>
                      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                      <span className="w-10 text-slate-600 font-bold text-right shrink-0">
                        {row.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review submit form */}
              <div className="mb-10 pb-10 border-b border-slate-200" id="submission-review-box">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {editingReviewId ? 'Update Your Dining Experience Review' : 'Post a Dining Experience Review'}
                </h4>
                
                {canSubmitReview ? (
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
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Attach Review Photos</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReviewFilesChange}
                        className="w-full bg-white border border-slate-205 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900"
                      />
                      <p className="mt-1 text-[10px] text-slate-400 font-semibold">Add up to 2 photos to accompany your review.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl hover:shadow-md transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        id="review-submit-btn"
                      >
                        <span>{editingReviewId ? 'Update Feedback Review' : 'Publish Feedback Review'}</span>
                        {submittingReview && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      </button>
                      {editingReviewId && (
                        <button
                          type="button"
                          onClick={resetReviewForm}
                          className="px-4 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-50 transition"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </form>
                ) : currentUser && isStaffUser ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center" id="review-staff-fallback">
                    <p className="text-amber-900 text-xs font-semibold leading-relaxed max-w-md mx-auto">
                      {currentUser.role === 'admin'
                        ? 'Admin accounts cannot post new reviews. Use the Admin Panel → Reviews tab to reply to customer feedback.'
                        : canReplyToReviews
                          ? 'As the restaurant owner, you can reply to customer reviews below. Owner accounts cannot post new reviews.'
                          : 'Restaurant owners can only reply to reviews on their own restaurants. You cannot post new reviews.'}
                    </p>
                  </div>
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

                        <div className="flex items-center gap-2">
                          {canManageReview(rev) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReviewEdit(rev)}
                                className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 hover:text-indigo-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewDelete(rev.id)}
                                className="text-[10px] font-bold uppercase tracking-wide text-rose-600 hover:text-rose-700"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg">
                            <span className="text-[9px] font-extrabold text-zinc-650 tracking-wide uppercase truncate max-w-[90px]">
                              {rev.reviewerName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-zinc-655 text-xs leading-relaxed pl-1 font-semibold">
                        "{rev.content}"
                      </p>
                      {rev.photos && rev.photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {rev.photos.map((photo, index) => (
                            <img
                              key={`${rev.id}-${index}`}
                              src={photo}
                              alt={`${rev.title} photo ${index + 1}`}
                              className="h-24 w-full rounded-xl object-cover border border-zinc-200"
                            />
                          ))}
                        </div>
                      )}

                      {Array.isArray(rev.responses) && rev.responses.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 space-y-2">
                          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-700">
                            Owner response
                          </div>
                          {rev.responses.map((response) => (
                            <div key={response._id || response.id} className="rounded-xl border border-emerald-200 bg-white/80 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                                  {response.userId?.username || 'Restaurant owner'}
                                </span>
                                {canReplyToReviews && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleReviewResponseEdit(rev, response)}
                                      className="text-[10px] font-bold uppercase tracking-wide text-indigo-600"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReviewResponseDelete(rev.id, response._id || response.id)}
                                      className="text-[10px] font-bold uppercase tracking-wide text-rose-600"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="mt-2 text-xs leading-relaxed text-zinc-700">{response.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {canReplyToReviews && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <label className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-2">
                            {editingResponse?.reviewId === rev.id ? 'Edit your reply' : 'Reply to this review'}
                          </label>
                          <textarea
                            rows={3}
                            value={responseDrafts[rev.id] || ''}
                            onChange={(e) => handleResponseDraftChange(rev.id, e.target.value)}
                            placeholder="Thank guests for their feedback and share any next steps..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReviewResponseSubmit(rev.id)}
                              disabled={submittingResponse}
                              className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                              {editingResponse?.reviewId === rev.id ? 'Update reply' : 'Publish reply'}
                            </button>
                            {editingResponse?.reviewId === rev.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingResponse(null);
                                  setResponseDrafts((prev) => ({ ...prev, [rev.id]: '' }));
                                }}
                                className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-extrabold uppercase tracking-wider"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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

              {isStaffUser ? (
                <div className="py-8 text-center" id="booking-staff-blocked">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-amber-400 mb-4 border border-slate-700">
                    <Lock size={20} />
                  </div>
                  <h4 className="text-sm font-black text-white tracking-wide uppercase">
                    Booking Unavailable
                  </h4>
                  <p className="text-slate-400 text-xs my-3 max-w-[240px] mx-auto leading-relaxed font-semibold">
                    {currentUser.role === "admin"
                      ? "Admin accounts cannot make table reservations. Use a customer account to book."
                      : "Restaurant owner accounts cannot make table reservations. Use a customer account to book."}
                  </p>
                </div>
              ) : currentUser ? (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {hasActiveBooking && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-100 leading-relaxed">
                      You already have an active reservation at this restaurant (
                      {activeRestaurantReservation?.status === "pending"
                        ? "awaiting approval"
                        : "confirmed"}
                      ).{" "}
                      <Link
                        to="/dashboard"
                        className="font-bold text-amber-200 underline hover:text-white"
                      >
                        View in My Reservations
                      </Link>{" "}
                      to cancel or manage it before booking again.
                    </div>
                  )}
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
                        max={maxBookingDateStr}
                        value={bookingDate}
                        onChange={(e) => handleBookingDateChange(e.target.value)}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value && !isDateWithinBookingWindow(value)) {
                            handleBookingDateChange('');
                          }
                        }}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-white select-none relative custom-calendar-field transition-all"
                        id="booking-date-field"
                        aria-label="Select booking date"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      Book from today through {maxBookingDateStr} ({BOOKING_WINDOW_MONTHS}-month window)
                    </p>
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
                          disabled={slot.isUnavailable}
                          onClick={() => setBookingTime(slot.time)}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            slot.isUnavailable
                              ? 'bg-slate-950/20 border-slate-800 text-slate-600 line-through cursor-not-allowed'
                              : bookingTime === slot.time
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md font-extrabold scale-102 shadow-indigo-900/30'
                              : 'bg-slate-950/50 border border-slate-800 text-slate-300 hover:border-indigo-505 hover:text-white'
                          }`}
                          id={`time-pills-${slot.time.replace(':', '_').replace(' ', '_')}`}
                        >
                          <span>{slot.time}</span>
                          <span className={`text-[8px] font-bold leading-none ${slot.isUnavailable ? 'text-slate-650' : bookingTime === slot.time ? 'text-indigo-250 font-bold' : 'text-slate-500'}`}>
                            {slot.isPast ? 'Passed' : slot.isFull ? 'Full' : 'Open'}
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
                      disabled={bookingLoading || hasActiveBooking}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs tracking-wider rounded-xl hover:shadow-lg hover:shadow-indigo-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      id="booking-submit-btn"
                    >
                      <span>
                        {paymentConfig?.enabled
                          ? `PAY DEPOSIT & BOOK (${formatDepositTotal(
                              paymentConfig.depositPerGuestMinorUnits ||
                                paymentConfig.depositPerGuestCents,
                              bookingGuests,
                              paymentConfig.currency,
                            )})`
                          : 'SCHEDULE DINING RESERVATION'}
                      </span>
                      {bookingLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    </button>
                    {paymentConfig && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] text-slate-500 text-center font-semibold leading-relaxed">
                          {paymentConfig.enabled
                            ? `Secure Razorpay checkout · ${paymentConfig.depositPerGuestDisplay || formatDepositTotal(paymentConfig.depositPerGuestMinorUnits || paymentConfig.depositPerGuestCents, 1, paymentConfig.currency)} deposit per guest`
                            : 'Demo payment mode is active (Razorpay keys not configured on server)'}
                        </p>
                        {paymentConfig.enabled && (
                          <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                            India test: UPI <span className="font-mono text-slate-500">success@razorpay</span> or domestic card 5267 3181 8797 5449
                          </p>
                        )}
                      </div>
                    )}
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
