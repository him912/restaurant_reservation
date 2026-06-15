/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RatingStars } from '../components/RatingStars';
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
  DollarSign,
  Star,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

export const OwnerDashboard = () => {
  const {
    restaurants,
    reservations,
    changeBookingStatus,
    updateRestaurantProfile,
    showToast
  } = useApp();

  // For high-fidelity testing, Sakura Omakase (rest-2) is the owner's default restaurant.
  const managedRestaurantId = 'rest-2';

  const restaurant = useMemo(() => {
    return restaurants.find(r => r.id === managedRestaurantId) || restaurants[0];
  }, [restaurants]);

  // States to edit restaurant profile
  const [name, setName] = useState(restaurant?.name || '');
  const [description, setDescription] = useState(restaurant?.description || '');
  const [phone, setPhone] = useState(restaurant?.phone || '');
  const [email, setEmail] = useState(restaurant?.email || '');
  const [capacity, setCapacity] = useState(restaurant?.capacity || 20);
  const [openingHours, setOpeningHours] = useState(restaurant?.openingHours || '5:00 PM - 11:00 PM');
  const [selectedFeatures, setSelectedFeatures] = useState(restaurant?.features || []);

  const [activeTab, setActiveTab] = useState('bookings');

  // Compute stats across ALL reservations for dynamic sandbox overview
  const totalBookings = reservations.length;
  const confirmedBookings = reservations.filter(r => r.status === 'confirmed').length;
  const pendingBookings = reservations.filter(r => r.status === 'pending').length;
  const cancelledBookings = reservations.filter(r => r.status === 'cancelled').length;

  // Revenue estimation: average dining covers are $110/guest for confirmed bookings
  const estRevenue = useMemo(() => {
    return reservations
      .filter(r => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.guests * 110, 0);
  }, [reservations]);

  // Handle Feature checkboxes toggle
  const handleFeatureToggle = (feat) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(prev => prev.filter(f => f !== feat));
    } else {
      setSelectedFeatures(prev => [...prev, feat]);
    }
  };

  // Preset features list they can check off
  const availableFeatures = [
    'Outdoor Seating',
    'Chef Table Only',
    'Pre-Payment Required',
    'Sake Flight Pairings',
    'Romantic Dinner Settings',
    'Intimate Minimalist Vibe',
    'Valet Parking Available',
    'Private Dining Rooms',
    'Gluten-Free Menu Options'
  ];

  // Save profile updates
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    const updated = {
      ...restaurant,
      name,
      description,
      phone,
      email,
      capacity: Number(capacity),
      openingHours,
      features: selectedFeatures
    };

    await updateRestaurantProfile(updated);
  };

  // Format date helper
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12" id="owner-dashboard-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header strip */}
        <section className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10" id="owner-header-box">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-650 text-white font-black rounded-2xl flex items-center justify-center text-lg shadow-lg">
              <Sliders size={22} />
            </div>
            <div>
              <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest font-mono">Administrative Control Cockpit</span>
              <h1 className="text-2xl font-black text-white leading-tight">Universal Booking Manager</h1>
              <p className="text-slate-450 text-xs mt-0.5">Administer reserve requests, seat allocations, and core site profiles.</p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              id="tab-btn-bookings"
            >
              Control Desk
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              id="tab-btn-profile"
            >
              My Profile Detail
            </button>
          </div>
        </section>

        {/* Dynamic Statistics cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10" id="owner-dashboard-metrics">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
              <DollarSign size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Est. Revenue</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">${estRevenue.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-700 border border-indigo-101">
              <CalendarCheck2 size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Confirmed</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{confirmedBookings} tables</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 border border-slate-200">
              <RefreshCw size={14} className="animate-spin duration-[4s]" />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pending Desk</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{pendingBookings} awaiting</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200">
              <ShieldAlert size={18} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Cancelled</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{cancelledBookings} counts</span>
            </div>
          </div>
        </section>

        {/* Content Tabs switches */}
        {activeTab === 'bookings' ? (
          /* BOOKINGS DESK INTERFACE */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="bookings-action-interface">
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Reservations Control Desk</h3>
                <p className="text-slate-500 text-xs mt-0.5">Real-time listing of all platform reservation actions. (Sandbox overrides available)</p>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto" id="reservations-table-container">
              {reservations.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-extrabold text-[10px]">
                      <th className="p-4 pl-6">Consumer Details</th>
                      <th className="p-4">Est. Venue Name</th>
                      <th className="p-4">Dining Particulars</th>
                      <th className="p-4">Cover Seats</th>
                      <th className="p-4">State Status</th>
                      <th className="p-4 pr-6 text-right">Interactive Command Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100" id="reservations-table-body">
                    {reservations.map(res => (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Consumer contact details */}
                        <td className="p-4 pl-6">
                          <div className="font-extrabold text-slate-900 text-sm">{res.customerName}</div>
                          <div className="text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                            <span>{res.customerEmail}</span>
                            <span>•</span>
                            <span>{res.customerPhone}</span>
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
                            <span>{res.guests} Guests</span>
                          </span>
                        </td>

                        {/* Status elements */}
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider border ${
                              res.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : res.status === 'cancelled'
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-indigo-50 text-indigo-750 border-indigo-200'
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>

                        {/* Control Actions buttons */}
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {res.status !== 'confirmed' && (
                              <button
                                onClick={() => changeBookingStatus(res.id, 'confirmed')}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm shrink-0 uppercase tracking-wider text-[9px] cursor-pointer"
                                id={`confirm-btn-${res.id}`}
                              >
                                <Check size={11} />
                                <span>Confirm Booking</span>
                              </button>
                            )}

                            {res.status !== 'cancelled' && (
                              <button
                                onClick={() => changeBookingStatus(res.id, 'cancelled')}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-105 text-rose-600 border border-rose-100 font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 uppercase tracking-wider text-[9px] cursor-pointer"
                                id={`decline-btn-${res.id}`}
                              >
                                <X size={11} />
                                <span>Decline Seat</span>
                              </button>
                            )}

                            {res.status === 'cancelled' && (
                              <span className="text-[10px] text-slate-400 italic font-semibold">No further actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-slate-400 italic font-semibold">No client reservations made yet.</div>
              )}
            </div>
          </div>
        ) : (
          /* MANAGED RESTAURANT PROFILE INTERACTIVE FORM */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start" id="owner-profile-editor">
            
            {/* Form details section container */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm" id="profile-editor-box">
              <h3 className="text-lg font-black text-slate-900 mb-6 pb-4 border-b border-slate-100">Manage Restaurant Details</h3>
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Restaurant Name label
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Core Operations Hours
                    </label>
                    <input
                      type="text"
                      value={openingHours}
                      onChange={e => setOpeningHours(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                    About / Description narrative
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
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
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Property Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-705 uppercase tracking-wider mb-1.5">
                      Max Seating capacity
                    </label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={e => setCapacity(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-slate-900 transition-all"
                    />
                  </div>
                </div>

                {/* Features checkboxes */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-750 uppercase tracking-wider mb-3">Amenities / Property Highlights</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="amenities-check-grid">
                    {availableFeatures.map(feat => {
                      const isChecked = selectedFeatures.includes(feat);
                      return (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => handleFeatureToggle(feat)}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span>{feat}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white font-bold' : 'border-slate-300 bg-white'}`}>
                            {isChecked && '✓'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-101">
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-755 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shadow-indigo-950/15"
                  >
                    <Save size={13} />
                    <span>SAVE PROFILE MODIFICATIONS</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Profile static summary review card */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-hidden" id="card-preview">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Real-Time App Preview</h4>
                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                  <img src={restaurant.image} alt={restaurant.name} className="w-full aspect-[16/10] object-cover" />
                  <div className="p-4 bg-slate-50 border-t border-slate-150">
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">{restaurant.cuisine}</span>
                    <h5 className="font-extrabold text-sm text-slate-900 mt-1.5 leading-tight">{name || restaurant.name}</h5>
                    <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mt-1.5">{description || restaurant.description}</p>
                    
                    <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-150">
                      {selectedFeatures.slice(0, 2).map((f, i) => (
                        <span key={i} className="bg-white border border-slate-150 rounded-lg px-2 py-0.5 text-[9px] font-semibold text-slate-500">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
