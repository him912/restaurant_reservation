/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Check, Calendar, Clock, Users, ArrowRight, Table, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatMoney } from '../utils/currency';

export const SuccessModal = ({ reservation, onClose }) => {
  useEffect(() => {
    if (!reservation) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [reservation, onClose]);

  return (
    <AnimatePresence>
      {reservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          id="success-modal-overlay"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative max-w-md w-full bg-slate-50 rounded-3xl shadow-3xl border border-white/10 overflow-hidden text-slate-900"
            id="success-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border-b border-slate-200 p-6 text-center relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 text-slate-500 hover:text-slate-800 transition-colors p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"
                id="close-success-btn"
                aria-label="Close reservation ticket"
              >
                <X size={18} />
              </button>
              <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <Check size={28} className="text-white" />
              </div>
              <h3 id="success-modal-title" className="text-xl font-bold tracking-tight text-black">
                {reservation.paymentStatus === 'paid'
                  ? 'Reservation Confirmed!'
                  : reservation.paymentStatus === 'failed'
                    ? 'Payment Failed'
                    : 'Reservation Submitted!'}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {reservation.paymentStatus === 'paid'
                  ? 'Deposit paid — your table request is awaiting restaurant approval.'
                  : reservation.paymentStatus === 'failed'
                    ? 'Your booking was saved but the deposit was not received. Pay from My Reservations.'
                    : 'Your dining table request is locked and loaded.'}
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-200">
                <img
                  src={reservation.restaurantImage}
                  alt={reservation.restaurantName}
                  className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-slate-200"
                />
                <div>
                  <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg mb-1 uppercase tracking-wide border border-indigo-100/60">
                    {reservation.restaurantCuisine}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-lg leading-tight">{reservation.restaurantName}</h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Booking ID:{' '}
                    <span className="font-mono text-slate-800 font-bold uppercase">{reservation.id}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                    <Calendar size={12} className="text-indigo-600" />
                    <span>Date</span>
                  </div>
                  <p className="font-bold text-xs text-slate-800">
                    {new Date(reservation.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                    <Clock size={12} className="text-indigo-600" />
                    <span>Time</span>
                  </div>
                  <p className="font-bold text-xs text-slate-800">{reservation.time}</p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                    <Users size={12} className="text-indigo-600" />
                    <span>Guests Size</span>
                  </div>
                  <p className="font-bold text-xs text-slate-800">
                    {reservation.guests} {reservation.guests === 1 ? 'Guest' : 'Guests'}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/20">
                  <div className="flex items-center gap-1.5 text-indigo-600 text-[10px] uppercase font-bold tracking-wider mb-1">
                    <Table size={12} />
                    <span>Assigned Table</span>
                  </div>
                  <p className="font-bold text-xs text-indigo-800">Table #{reservation.tableNumber || 6}</p>
                </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-2xl mb-6 text-xs font-medium">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Guest Name</span>
                  <span className="font-extrabold text-slate-800">{reservation.customerName}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Contact Email</span>
                  <span className="text-slate-800 break-all ml-4 text-right font-semibold">{reservation.customerEmail}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Payment</span>
                  <span
                    className={`font-extrabold ${
                      reservation.paymentStatus === 'paid'
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {reservation.paymentStatus === 'paid'
                      ? `Paid ${formatMoney(reservation.paymentAmount, reservation.paymentCurrency)} deposit`
                      : (reservation.paymentStatus || 'unpaid').toUpperCase()}
                  </span>
                </div>
                {reservation.specialRequests && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-slate-500 block font-bold text-[10px] uppercase tracking-wider mb-1">
                      Preferences / Requests:
                    </span>
                    <p className="text-slate-700 italic leading-relaxed py-2 px-3 bg-white border border-slate-100 rounded-xl">
                      "{reservation.specialRequests}"
                    </p>
                  </div>
                )}
              </div>

              <div className="relative h-px border-t-2 border-dashed border-slate-300 my-6">
                <div className="absolute -left-10 -top-2.5 w-5 h-5 bg-slate-950/70 rounded-full"></div>
                <div className="absolute -right-10 -top-2.5 w-5 h-5 bg-slate-950/70 rounded-full"></div>
              </div>

              <div className="text-center pt-2">
                <div className="inline-block bg-white p-2.5 border border-slate-200 rounded-xl mb-3">
                  <div className="flex items-center justify-center gap-[3px] h-9 w-44 mx-auto opacity-80" aria-hidden="true">
                    <div className="w-[1px] h-full bg-black"></div>
                    <div className="w-[3px] h-full bg-black"></div>
                    <div className="w-[1px] h-full bg-black"></div>
                    <div className="w-[2px] h-full bg-black"></div>
                    <div className="w-[4px] h-full bg-black"></div>
                    <div className="w-[1px] h-full bg-black"></div>
                    <div className="w-[3px] h-full bg-black"></div>
                    <div className="w-[2px] h-full bg-black"></div>
                    <div className="w-[4px] h-full bg-black"></div>
                    <div className="w-[1px] h-full bg-black"></div>
                  </div>
                  <span className="block font-mono text-[10px] text-zinc-500 tracking-[0.25em] uppercase">
                    {reservation.id}-TABLE{reservation.tableNumber || 6}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  id="final-ticket-dismiss-btn"
                >
                  <span>Excellent, Got It</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
