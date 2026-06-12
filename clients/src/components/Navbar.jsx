/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  UtensilsCrossed,
  Calendar,
  Award,
  User,
  Menu,
  X,
  ArrowLeftRight,
  Building,
  LogIn,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Navbar = () => {
  const { currentUser, switchUserRole, reservations, openAuthModal, logout } =
    useApp();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const pendingCount = reservations.filter(
    (r) => r.status === "pending",
  ).length;

  const toggleMenu = () => setIsOpen(!isOpen);

  const isActive = (path) => location.pathname === path;

  const handleRoleToggle = () => {
    console.log(currentUser?.role);
    const currentRole = currentUser?.role 
    // || "user";
    // const nextRole = currentRole === "user" ? "user" : "owner";
    // switchUserRole(nextRole);
    // setIsOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md"
      id="main-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            id="nav-brand-link"
          >
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-all duration-150 shadow-md">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900 block leading-tight">
                DineFlow
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                RESERVATIONS & REVIEWS
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-6" id="desktop-nav">
            <Link
              to="/"
              className={`text-sm font-semibold transition-all py-1.5 px-3 rounded-xl ${
                isActive("/")
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
              }`}
              id="nav-link-explore"
            >
              Explore Table
            </Link>

            {currentUser ? (
              currentUser.role === "user" ? (
                <Link
                  to="/dashboard"
                  className={`text-sm font-semibold transition-all py-1.5 px-3 rounded-xl flex items-center gap-1.5 ${
                    isActive("/dashboard")
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                  }`}
                  id="nav-link-dashboard"
                >
                  <Calendar size={14} />
                  <span>My Reservations</span>
                </Link>
              ) : (
                <Link
                  to="/owner-dashboard"
                  className={`text-sm font-semibold transition-all py-1.5 px-3 rounded-xl flex items-center gap-1.5 ${
                    isActive("/owner-dashboard")
                      ? "text-indigo-600 bg-indigo-50/80 border border-indigo-200"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-55"
                  }`}
                  id="nav-link-owner"
                >
                  <Building
                    size={14}
                    className="text-indigo-600 animate-pulse"
                  />
                  <span>Restaurant Cockpit</span>
                  {pendingCount > 0 && (
                    <span className="ml-1 w-5 h-5 bg-indigo-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-sm">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )
            ) : (
              <button
                onClick={() => openAuthModal("login")}
                className="text-sm font-semibold text-slate-605 transition-all py-1.5 px-3 rounded-xl hover:text-indigo-600 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                id="nav-link-reservations-prompt"
              >
                <Calendar size={14} className="text-slate-400" />
                <span>My Reservations</span>
              </button>
            )}
          </nav>

          {/* Desktop Right Panel (Authentication Switcher & Sandbox Tool) */}
          <div
            className="hidden md:flex items-center gap-4"
            id="desktop-right-panel"
          >
            {/* Quick switcher to ease system preview testing */}
            <div
              className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200"
              id="sandbox-switcher"
            >
              <button
                onClick={handleRoleToggle}
                className="flex items-center gap-1.5 py-1 px-3.5 rounded-lg text-xs font-semibold shadow-sm cursor-pointer bg-white text-slate-900 hover:bg-slate-50"
                id="role-switch-button"
                title="Sandbox Switch role to test Customer and Owner flows"
              >
                <ArrowLeftRight size={13} className="text-slate-500" />
                <span>Role: </span>
                <span className="font-extrabold uppercase tracking-wide text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {currentUser
                    ? currentUser.role === "user"
                      ? "Customer"
                      : "Owner"
                    : "None"}
                </span>
              </button>
            </div>

            {currentUser ? (
              /* Authenticated States Display */
              <div
                className="flex items-center gap-2.5"
                id="user-logged-in-profile"
              >
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-1.5 px-3.5 rounded-xl">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  <span
                    className="text-xs font-bold text-slate-800 truncate max-w-[130px]"
                    title={currentUser.email}
                  >
                    {currentUser.name}
                  </span>
                </div>

                {/* Sign Out CTA */}
                <button
                  onClick={logout}
                  className="p-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-605 text-slate-500 rounded-xl border border-slate-200 hover:border-rose-200 transition-all cursor-pointer flex items-center justify-center"
                  title="Sign Out of DineFlow"
                  id="navbar-signout-btn"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              /* Unauthenticated States Display */
              <div
                className="flex items-center gap-2"
                id="user-logged-out-actions"
              >
                <button
                  onClick={() => openAuthModal("login")}
                  className="text-xs font-bold text-slate-700 hover:text-indigo-600 transition-all py-2 px-3.5 rounded-xl cursor-pointer"
                  id="navbar-login-trigger"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal("signup")}
                  className="text-xs font-bold text-white bg-indigo-605 hover:bg-indigo-700 transition-all py-2.5 px-4 rounded-xl shadow-sm cursor-pointer"
                  id="navbar-signup-trigger"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Sandwich menu toggle */}
          <div
            className="flex items-center gap-2 md:hidden"
            id="mobile-menu-toggle-wrapper"
          >
            {/* Quick switcher also on mobile header */}
            <button
              onClick={handleRoleToggle}
              className="flex items-center gap-1 py-1 px-2 text-[10px] rounded-lg font-bold border bg-slate-50 border-slate-200 leading-none cursor-pointer"
              id="mobile-role-switch"
            >
              <ArrowLeftRight size={11} />
              <span className="uppercase text-indigo-700">
                {currentUser
                  ? currentUser.role === "customer"
                    ? "Customer"
                    : "Owner"
                  : "None"}
              </span>
            </button>

            <button
              onClick={toggleMenu}
              className="text-slate-500 hover:text-slate-900 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle menu"
              id="sandwich-btn"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden border-t border-zinc-150 bg-white"
            id="mobile-drawer-menu"
          >
            <div className="px-4 pt-3 pb-5 space-y-2">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-semibold ${
                  isActive("/")
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                id="mobile-link-explore"
              >
                Explore Restaurants
              </Link>

              {currentUser ? (
                currentUser.role === "customer" ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2.5 rounded-xl text-base font-semibold flex items-center gap-1.5 ${
                      isActive("/dashboard")
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-slate-655 hover:bg-slate-50"
                    }`}
                    id="mobile-link-dashboard"
                  >
                    <Calendar size={16} />
                    <span>My Reservations</span>
                  </Link>
                ) : (
                  <Link
                    to="/owner-dashboard"
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2.5 rounded-xl text-base font-semibold flex items-center gap-1.5 ${
                      isActive("/owner-dashboard")
                        ? "text-indigo-600 bg-indigo-50 border border-indigo-200"
                        : "text-slate-655 hover:bg-slate-50"
                    }`}
                    id="mobile-link-owner"
                  >
                    <Building size={16} className="text-indigo-600" />
                    <span>Owner Cockpit</span>
                    {pendingCount > 0 && (
                      <span className="ml-1 w-5 h-5 bg-indigo-600 text-white font-bold text-xs rounded-full flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    openAuthModal("login");
                  }}
                  className="w-full text-left block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar size={16} className="text-slate-400" />
                  <span>My Reservations (Sign In)</span>
                </button>
              )}

              {/* Mobile Profile info banner or Login Buttons */}
              {currentUser ? (
                <div className="pt-4 mt-4 border-t border-zinc-150 px-3 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-250 flex items-center justify-center text-zinc-655 font-bold text-sm">
                      <User size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-800 leading-tight">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>

                  {/* Sign out mobile action */}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    id="mobile-signout-btn"
                  >
                    <LogOut size={13} />
                    <span>Logout Session</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 mt-4 border-t border-zinc-150 px-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      openAuthModal("login");
                    }}
                    className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 font-bold text-xs rounded-xl text-slate-700 transition cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      openAuthModal("signup");
                    }}
                    className="py-2.5 px-3 bg-indigo-650 hover:bg-indigo-700 font-bold text-white text-xs rounded-xl transition cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
