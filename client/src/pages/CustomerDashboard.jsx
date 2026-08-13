/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RatingStars } from '../components/RatingStars';
import { Calendar, Clock, Users, Ban, Sparkles, Star, History, BookmarkCheck, UtensilsCrossed, CreditCard, Phone, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
  canCustomerCancelReservation,
  canCustomerEditReservation,
  canRetryPayment,
  getPaymentStatusLabel,
  isPaidAndConfirmed,
} from '../utils/paymentFlow';
import {
  getTodayDateString,
  getMaxBookingDateString,
  isPastBookingDate,
  isBeyondBookingWindow,
  BOOKING_WINDOW_MONTHS,
  toTimeInputValue,
  formatTimeForDisplay,
} from '../utils/bookingDate';
import { getReservationDateTime, isReservationPast } from '../utils/reservationLifecycle';
import { formatMoney } from '../utils/currency';
import {
  validateReservationEditForm,
  getFirstFormError,
  MAX_SPECIAL_REQUESTS_LENGTH,
} from '../utils/reservationFormValidation';

export const CustomerDashboard = () => {
  const {
    currentUser,
    reservations,
    cancelUserReservation,
    updateUserReservation,
    retryReservationPayment,
    refreshReservations,
    openAuthModal,
    showToast,
  } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    date: '',
    time: '',
    guests: 2,
    customerPhone: '',
    specialRequests: '',
  });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const todayDateStr = getTodayDateString();
  const maxBookingDateStr = getMaxBookingDateString();

  const clearEditFormError = (field) => {
    setEditFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const editInputErrorClass = (field) =>
    editFormErrors[field]
      ? 'border-rose-400 focus:border-rose-500'
      : 'border-slate-200 focus:border-indigo-500';

  const editFieldError = (field) =>
    editFormErrors[field] ? (
      <p className="text-[10px] text-rose-600 font-semibold mt-1">{editFormErrors[field]}</p>
    ) : null;

  const handleEditDateChange = (value) => {
    if (value && isPastBookingDate(value)) {
      setEditFormErrors((prev) => ({
        ...prev,
        date: 'Past dates cannot be selected. Please choose today or a future date.',
      }));
      return;
    }
    if (value && isBeyondBookingWindow(value)) {
      setEditFormErrors((prev) => ({
        ...prev,
        date: `Choose a date within the next ${BOOKING_WINDOW_MONTHS} months.`,
      }));
      return;
    }
    clearEditFormError('date');
    setEditForm((prev) => ({ ...prev, date: value }));
  };

  useEffect(() => {
    api.getPaymentConfig().then(setPaymentConfig).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin' || currentUser.role === 'restaurant_owner') {
      return;
    }
    refreshReservations().catch(() => {});
  }, [currentUser, refreshReservations]);

  const getPaymentBadgeClass = (paymentStatus) => {
    if (paymentStatus === 'paid') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    }
    if (paymentStatus === 'failed') {
      return 'bg-rose-50 text-rose-700 border-rose-100';
    }
    if (paymentStatus === 'pending') {
      return 'bg-amber-50 text-amber-800 border-amber-100';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const handlePayNow = async (reservation) => {
    try {
      setPayingId(reservation.id);
      await retryReservationPayment(reservation, paymentConfig);
    } catch (err) {
      console.error(err);
      showToast('Could not start payment. Please try again.', 'error');
    } finally {
      setPayingId(null);
    }
  };

  // Filter individual user reservations (matched by mock email or name)
  const userReservations = useMemo(() => {
    if (!currentUser) return [];
    const currentUserEmail = (currentUser.email || "").toLowerCase();

    return reservations.filter((r) => {
      const reservationEmail = (r.customerEmail || r.userEmail || currentUserEmail || "").toLowerCase();
      return reservationEmail === currentUserEmail;
    });
  }, [reservations, currentUser]);

  // Divide into upcoming and past
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const active = [];
    const historic = [];

    userReservations.forEach((reservation) => {
      if (reservation.status === 'cancelled' || isReservationPast(reservation)) {
        historic.push(reservation);
      } else {
        active.push(reservation);
      }
    });

    const sortByBookingDate = (a, b) => {
      const aTime = getReservationDateTime(a)?.getTime() || 0;
      const bTime = getReservationDateTime(b)?.getTime() || 0;
      return bTime - aTime;
    };

    active.sort(sortByBookingDate);
    historic.sort(sortByBookingDate);

    return { upcomingBookings: active, pastBookings: historic };
  }, [userReservations]);

  const handleCancelClick = async (reservation) => {
    if (!canCustomerCancelReservation(reservation)) {
      showToast(
        'Confirmed paid reservations cannot be cancelled online. Please contact the restaurant.',
        'error',
      );
      return;
    }

    if (
      window.confirm(
        'Are you sure you want to cancel this reservation? The table will be immediately opened to other guests.',
      )
    ) {
      await cancelUserReservation(reservation.id);
    }
  };

  const handleEditStart = (reservation) => {
    if (!canCustomerEditReservation(reservation)) {
      showToast(
        'Confirmed paid reservations cannot be edited online. Please contact the restaurant.',
        'error',
      );
      return;
    }

    setEditingId(reservation.id);
    setEditFormErrors({});
    setEditForm({
      date: reservation.date || '',
      time: toTimeInputValue(reservation.time || ''),
      guests: reservation.guests || reservation.partySize || 2,
      customerPhone: reservation.customerPhone || currentUser?.phone || '',
      specialRequests: reservation.specialRequests || '',
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormErrors({});
    setEditForm({
      date: '',
      time: '',
      guests: 2,
      customerPhone: '',
      specialRequests: '',
    });
  };

  const handleEditSave = async (id) => {
    const errors = validateReservationEditForm(editForm, { maxGuests: 10 });
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      showToast(getFirstFormError(errors), 'error');
      return;
    }

    try {
      await updateUserReservation(id, {
        date: editForm.date,
        time: editForm.time,
        guests: Number(editForm.guests),
        customerPhone: editForm.customerPhone.trim(),
        specialRequests: editForm.specialRequests.trim(),
      });
      handleEditCancel();
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex items-center justify-center p-6" id="dashboard-logged-out-container">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl text-center"
          id="dashboard-prompt-card"
        >
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-100 shadow-inner">
            <UtensilsCrossed size={28} className="animate-spin duration-[10s]" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Your Dining Portal</h2>
          <p className="text-slate-500 text-xs mt-2.5 leading-relaxed max-w-sm mx-auto">
            You must be signed in to review your confirmed table bookings, cancel scheduled dining times, or leave elite restaurant reviews.
          </p>
          <div className="mt-8 space-y-3">
            <button
               onClick={() => openAuthModal('login')}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
              id="dashboard-signin-prompt-btn"
            >
              SIGN IN TO ACCOUNT
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-750 font-extrabold text-xs tracking-wider rounded-xl transition-all cursor-pointer"
              id="dashboard-signup-prompt-btn"
            >
              CREATE A VIP DINER ACCOUNT
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-6 block">DineFlow Verified Authenticator Platform</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12" id="customer-dashboard-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header segment */}
        <section className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8" id="dashboard-header-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 text-white font-extrabold rounded-2xl flex items-center justify-center text-xl shadow-md">
              {currentUser.name[0]}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Diner Profile Portal</span>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{currentUser.name}</h1>
              <p className="text-slate-505 text-xs mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 flex-wrap bg-slate-50 border border-slate-200 p-4 rounded-2xl" id="dashboard-quick-stats">
            <div className="px-4 border-r border-slate-200">
              <span className="block text-2xl font-black text-slate-900 leading-none">{upcomingBookings.length}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Upcoming</span>
            </div>
            <div className="px-4 border-r border-slate-200">
              <span className="block text-2xl font-black text-slate-900 leading-none">
                {userReservations.filter(r => r.status === 'confirmed').length}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Visit Count</span>
            </div>
            <div className="px-4">
              <span className="block text-2xl font-black text-indigo-600 leading-none">VIP</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Diner Rank</span>
            </div>
          </div>
        </section>

        {/* Dash Main Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start" id="dashboard-grid">
          
          {/* LEFT 2-COLUMNS: THE BOOKINGS TRACKERS */}
          <div className="lg:col-span-2 space-y-8" id="dashboard-bookings-section">
            
            {/* Active Bookings Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm" id="upcoming-reservations-box">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <BookmarkCheck className="text-indigo-600" size={18} />
                <span>Upcoming Reservations</span>
              </h3>

              {upcomingBookings.length > 0 ? (
                <div className="space-y-4" id="upcoming-bookings-stack">
                  {upcomingBookings.map(res => (
                    <div
                      key={res.id}
                      className="bg-white rounded-2xl border border-slate-105 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden"
                      id={`booking-card-${res.id}`}
                    >
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-stretch justify-between">
                        {/* Restaurant Thumbnail & parameters */}
                        <div className="flex gap-4 items-center">
                          <img
                            src={res.restaurantImage}
                            alt={res.restaurantName}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                          />
                          <div>
                            <span className="bg-indigo-50 text-indigo-705 text-[9px] font-bold px-2.5 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-wide">
                              {res.restaurantCuisine}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm mt-1 sm:text-base leading-tight">
                              {res.restaurantName}
                            </h4>
                            <span className="font-mono text-[10px] text-slate-450 font-semibold block mt-0.5">Tear code: {res.id}</span>
                          </div>
                        </div>

                        {/* Timing particulars */}
                        <div className="grid grid-cols-3 sm:flex items-center gap-4 sm:gap-6 text-xs text-slate-655 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          {editingId !== res.id && (
                            <>
                              <div>
                                <div className="flex items-center gap-1 text-slate-400 font-bold text-[9px] uppercase">
                                  <Calendar size={11} className="text-slate-400" />
                                  <span>Date</span>
                                </div>
                                <span className="font-extrabold text-slate-805 block mt-0.5">
                                  {new Date(res.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>

                              <div>
                                <div className="flex items-center gap-1 text-slate-400 font-bold text-[9px] uppercase">
                                  <Clock size={11} className="text-slate-400" />
                                  <span>Time</span>
                                </div>
                                <span className="font-extrabold text-slate-805 block mt-0.5">{formatTimeForDisplay(res.time)}</span>
                              </div>

                              <div>
                                <div className="flex items-center gap-1 text-slate-400 font-bold text-[9px] uppercase">
                                  <Users size={11} className="text-slate-400" />
                                  <span>Seats</span>
                                </div>
                                <span className="font-extrabold text-slate-850 block mt-0.5">{res.guests} Guests</span>
                              </div>
                            </>
                          )}
                        </div>

                        {editingId !== res.id && (res.customerPhone || res.specialRequests) && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                            {res.customerPhone && (
                              <div className="flex items-start gap-2 text-slate-600">
                                <Phone size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                <span className="font-semibold">{res.customerPhone}</span>
                              </div>
                            )}
                            {res.specialRequests && (
                              <div className="flex items-start gap-2 text-slate-600">
                                <MessageSquare size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                <span className="font-medium leading-relaxed">{res.specialRequests}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {editingId === res.id && (
                          <div className="mt-4 pt-4 border-t border-slate-100 w-full">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                              Edit reservation details
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Date</label>
                                <input
                                  type="date"
                                  required
                                  min={todayDateStr}
                                  max={maxBookingDateStr}
                                  value={editForm.date}
                                  onChange={(e) => handleEditDateChange(e.target.value)}
                                  className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold focus:outline-none ${editInputErrorClass('date')}`}
                                />
                                {editFieldError('date')}
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Time</label>
                                <input
                                  type="time"
                                  required
                                  value={editForm.time}
                                  onChange={(e) => {
                                    clearEditFormError('time');
                                    setEditForm({ ...editForm, time: e.target.value });
                                  }}
                                  className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold focus:outline-none ${editInputErrorClass('time')}`}
                                />
                                {editFieldError('time')}
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Guests</label>
                                <select
                                  value={editForm.guests}
                                  onChange={(e) => {
                                    clearEditFormError('guests');
                                    setEditForm({ ...editForm, guests: Number(e.target.value) });
                                  }}
                                  className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold bg-white focus:outline-none ${editInputErrorClass('guests')}`}
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                                  ))}
                                </select>
                                {editFieldError('guests')}
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Phone</label>
                                <input
                                  type="tel"
                                  required
                                  value={editForm.customerPhone}
                                  onChange={(e) => {
                                    clearEditFormError('customerPhone');
                                    setEditForm({ ...editForm, customerPhone: e.target.value });
                                  }}
                                  placeholder="Contact number"
                                  className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold focus:outline-none ${editInputErrorClass('customerPhone')}`}
                                />
                                {editFieldError('customerPhone')}
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                                  Special requests / accommodations
                                </label>
                                <textarea
                                  rows={3}
                                  maxLength={MAX_SPECIAL_REQUESTS_LENGTH}
                                  value={editForm.specialRequests}
                                  onChange={(e) => {
                                    clearEditFormError('specialRequests');
                                    setEditForm({ ...editForm, specialRequests: e.target.value });
                                  }}
                                  placeholder="E.g. wheelchair access, outdoor seating, allergies, celebration notes..."
                                  className={`w-full rounded-lg border px-2.5 py-2 text-xs font-medium leading-relaxed resize-y focus:outline-none ${editInputErrorClass('specialRequests')}`}
                                />
                                {editFieldError('specialRequests')}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleEditSave(res.id)}
                                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg"
                              >
                                Save changes
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Status badge & cancel triggers */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          <div className="flex flex-col items-end gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                                res.status === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                  : res.status === 'cancelled'
                                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-100'
                              }`}
                            >
                              {res.status === 'pending' ? 'awaiting approval' : res.status}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${getPaymentBadgeClass(res.paymentStatus)}`}
                            >
                              {res.paymentStatus === 'paid'
                                ? `paid ${formatMoney(res.paymentAmount, res.paymentCurrency)}`
                                : getPaymentStatusLabel(res.paymentStatus)}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 items-end">
                            {canRetryPayment(res, paymentConfig) && (
                              <button
                                onClick={() => handlePayNow(res)}
                                disabled={payingId === res.id}
                                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1 py-1.5 px-2.5 rounded-xl transition cursor-pointer"
                                id={`pay-btn-${res.id}`}
                              >
                                <CreditCard size={12} />
                                <span>{payingId === res.id ? 'Opening…' : 'Pay Now'}</span>
                              </button>
                            )}

                            {canCustomerEditReservation(res) ? (
                              <button
                                onClick={() => handleEditStart(res)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 py-1 px-2.5 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                                id={`edit-btn-${res.id}`}
                              >
                                <Calendar size={12} />
                                <span>Edit</span>
                              </button>
                            ) : isPaidAndConfirmed(res) ? (
                              <span className="text-[10px] font-semibold text-slate-400 text-right max-w-[140px] leading-snug">
                                Confirmed paid bookings cannot be edited online
                              </span>
                            ) : null}

                            {canCustomerCancelReservation(res) ? (
                              <button
                                onClick={() => handleCancelClick(res)}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 py-1 px-2.5 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                id={`cancel-btn-${res.id}`}
                              >
                                <Ban size={12} />
                                <span>Cancel Seat</span>
                              </button>
                            ) : isPaidAndConfirmed(res) ? (
                              <span className="text-[10px] font-semibold text-slate-400 text-right max-w-[140px] leading-snug">
                                Confirmed paid bookings cannot be cancelled online
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl" id="empty-active-bookings">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                    <UtensilsCrossed size={18} />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">No upcoming reservations</h4>
                  <p className="text-slate-500 text-xs mb-6 max-w-sm mx-auto leading-relaxed font-medium">
                    Planning a client dining or special private date tonight? Experience instant confirmation.
                  </p>
                  <Link
                    to="/"
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                    id="dashboard-explore-trigger"
                  >
                    Select culinary table
                  </Link>
                </div>
              )}
            </div>

            {/* Historic Dining Bookings */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm" id="historic-reservations-box">
              <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
                <History className="text-slate-400" size={16} />
                <span>Past & Cancelled Logbook</span>
              </h3>

              {pastBookings.length > 0 ? (
                <div className="divide-y divide-slate-100" id="historic-bookings-feed">
                  {pastBookings.map(res => (
                    <div key={res.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={res.restaurantImage}
                          alt={res.restaurantName}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-100 bg-slate-50"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{res.restaurantName}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            {res.status === 'cancelled'
                              ? `Cancelled · ${new Date(res.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                              : `Dined on ${new Date(res.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                            {res.time ? ` at ${formatTimeForDisplay(res.time)}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <span>{res.guests} seats</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide border ${getPaymentBadgeClass(res.paymentStatus)}`}
                        >
                          {res.paymentStatus === 'paid'
                            ? 'paid'
                            : getPaymentStatusLabel(res.paymentStatus)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide border ${
                            res.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : res.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                : 'bg-amber-50 text-amber-800 border-amber-100'
                          }`}
                        >
                          {res.status === 'pending' ? 'awaiting approval' : res.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic py-2">No preceding dining records locked in.</p>
              )}
            </div>

          </div>

          {/* RIGHT 1-COLUMN: DYNAMIC DINING ACCENT INFO & SANDBOX DETAILS */}
          <div className="space-y-6" id="dashboard-sidebar">
            {/* VIP Status card */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden" id="dashboard-rank-banner">
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 opacity-15">
                <Star size={150} className="fill-white text-white" />
              </div>
              <span className="bg-white/20 backdrop-blur-md py-1 px-3 text-[9px] font-bold rounded-full uppercase tracking-widest inline-block border border-white/10 mb-4">
                DineFlow Club VIP
              </span>
              <h4 className="text-xl font-bold tracking-tight mb-2">Gold Tier Status</h4>
              <p className="text-white/80 text-xs leading-relaxed mb-6 font-semibold">
                You possess priority scheduling on weekend time slots and zero cancellation penalities. Keep writing critiques to level up to Platinum!
              </p>
              
              <div className="pt-4 border-t border-white/25 flex justify-between items-center text-xs">
                <div>
                  <span className="block opacity-75 font-semibold">Points earned</span>
                  <span className="font-extrabold text-sm text-indigo-100">1,240 pts</span>
                </div>
                <div className="text-right">
                  <span className="block opacity-75 font-semibold">Review level</span>
                  <span className="font-extrabold text-sm text-indigo-100">Lv. 3 Critic</span>
                </div>
              </div>
            </div>

            {/* Platform rules advisory */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 text-xs text-slate-500 space-y-3 shadow-xs" id="dashboard-advisory-box">
              <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Reservation Terms:</h4>
              <p className="leading-relaxed font-semibold">
                ● Once payment is complete and the reservation is confirmed by the restaurant, online edits and cancellations are not available.
              </p>
              <p className="leading-relaxed font-semibold">
                ● Seating reservations are held up to exactly 15 minutes past scheduled slot time.
              </p>
              <p className="leading-relaxed font-semibold">
                ● Dress codes are custom set check details relative to each establishment's list of details.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
