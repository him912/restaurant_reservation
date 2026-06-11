/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RatingStars } from '../components/RatingStars';
import { Calendar, Clock, Users, Ban, Sparkles, Star, History, BookmarkCheck, UtensilsCrossed } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const CustomerDashboard = () => {
  const { currentUser, reservations, cancelUserReservation, openAuthModal } = useApp();

  // Filter individual user reservations (matched by mock email or name)
  const userReservations = useMemo(() => {
    if (!currentUser) return [];
    return reservations.filter(
      r => r.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [reservations, currentUser]);

  // Divide into upcoming and past
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const active = [];
    const historic = [];

    const now = new Date();
    userReservations.forEach(r => {
      const bDate = new Date(`${r.date} ${r.time.split(' - ')[0]}`);
      // If cancelled, or past date limit
      if (r.status === 'cancelled' || bDate < now) {
        historic.push(r);
      } else {
        active.push(r);
      }
    });

    return { upcomingBookings: active, pastBookings: historic };
  }, [userReservations]);

  const handleCancelClick = async (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation? The table will be immediately opened to other guests.')) {
      await cancelUserReservation(id);
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
                            <span className="font-extrabold text-slate-805 block mt-0.5">{res.time}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1 text-slate-400 font-bold text-[9px] uppercase">
                              <Users size={11} className="text-slate-400" />
                              <span>Seats</span>
                            </div>
                            <span className="font-extrabold text-slate-850 block mt-0.5">{res.guests} Guests</span>
                          </div>
                        </div>

                        {/* Status badge & cancel triggers */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                              res.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                : 'bg-indigo-50 text-indigo-750 border-indigo-100'
                            }`}
                          >
                            {res.status}
                          </span>

                          <button
                            onClick={() => handleCancelClick(res.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 py-1 px-2.5 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            id={`cancel-btn-${res.id}`}
                          >
                            <Ban size={12} />
                            <span>Cancel Seat</span>
                          </button>
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
                            Dined on {new Date(res.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <span>{res.guests} seats</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide border ${
                            res.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-indigo-50/50 text-indigo-750 border-indigo-100'
                          }`}
                        >
                          {res.status}
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
                ● Cancel at minimum 2 hours prior to arrival time out of respect to partner culinary staff.
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
