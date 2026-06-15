/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  Sparkles,
  Building,
  ArrowRight,
  RefreshCw,
  KeyRound,
} from "lucide-react";

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    closeAuthModal,
    login,
    signup,
    forgotPassword,
  } = useApp();

  // Form Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Password Reset simulation state
  const [isResetSent, setIsResetSent] = useState(false);
  const [resetCode, setResetCode] = useState("");

  if (!isAuthModalOpen) return null;

  const handleTabChange = (newTab) => {
    setAuthModalTab(newTab);
    setError(null);
    setIsResetSent(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email address is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (authModalTab === "login") {
        const success = await login(email, password || "password");
        if (success) {
          resetFields();
        } else {
          setError("Invalid credentials. Check email or sign up!");
        }
      } else if (authModalTab === "signup") {
        if (!name) {
          setError("Please provide your name.");
          setIsSubmitting(false);
          return;
        }
        const success = await signup(name, email, role, password || "password");
        if (success) {
          resetFields();
        } else {
          setError("Signup failed. Email may already be in use.");
        }
      } else if (authModalTab === "forgot") {
        const success = await forgotPassword(email);
        if (success) {
          setIsResetSent(true);
          // Generate a mock code for high fidelity previewing
          setResetCode(Math.floor(100000 + Math.random() * 900000).toString());
        } else {
          setError("Email not found. Try signing up!");
        }
      }
    } catch (err) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFields = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("customer");
    setShowPassword(false);
    setError(null);
    setIsResetSent(false);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
        id="auth-modal-overlay"
        onClick={closeAuthModal}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          className="relative max-w-md w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden"
          id="auth-modal-card"
          onClick={(e) => e.stopPropagation()} // Stop bubbling
        >
          {/* Header & Logo Section */}
          <div className="p-6 pb-4 border-b border-slate-850 flex items-center justify-between bg-gradient-to-r from-indigo-950/40 to-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow">
                <Sparkles size={15} />
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-white leading-tight">
                  DineFlow Portal
                </span>
                <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
                  Elegance Verified
                </span>
              </div>
            </div>

            <button
              onClick={closeAuthModal}
              className="p-1 px-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-full transition-all cursor-pointer"
              id="auth-modal-close"
              aria-label="Close Authentication Screen"
            >
              <X size={16} />
            </button>
          </div>

          {/* Core Body Container */}
          <div className="p-6 md:p-8">
            {/* Header titles */}
            <div className="mb-6 text-center">
              <h2 className="text-xl font-black tracking-tight text-white uppercase">
                {authModalTab === "login" && "Welcome Back"}
                {authModalTab === "signup" && "Create Account"}
                {authModalTab === "forgot" && "Reset Password"}
              </h2>
              <p className="text-slate-450 text-xs mt-1 leading-relaxed">
                {authModalTab === "login" &&
                  "Unlock instant dining slots and track active seating covers."}
                {authModalTab === "signup" &&
                  "Gain custom VIP dining point tallies and critic status levels."}
                {authModalTab === "forgot" &&
                  "Authenticate identity to reset system profile credentials."}
              </p>
            </div>

            {/* Error notifications */}
            {error && (
              <div
                className="mb-5 p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-[11px] text-rose-300 font-semibold flex items-start gap-2 leading-relaxed"
                id="auth-error-banner"
              >
                <ShieldAlert
                  size={14}
                  className="shrink-0 mt-0.5 text-rose-400"
                />
                <span>{error}</span>
              </div>
            )}

            {/* Simulated Password Reset success state */}
            {authModalTab === "forgot" && isResetSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center py-4 px-2"
                id="reset-success-stage"
              >
                <div className="w-12 h-12 bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <KeyRound size={20} className="animate-bounce" />
                </div>
                <div className="space-y-1">
                  <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest block">
                    Recovery Dispatched
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed max-w-sm mx-auto">
                    We've simulated sending a recovery link to{" "}
                    <span className="font-bold text-white break-all">
                      {email}
                    </span>
                    . Use the security credentials below:
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-w-xs mx-auto">
                  <span className="block text-[9px] text-slate-500 font-mono tracking-widest uppercase">
                    Secret OTP Code
                  </span>
                  <span className="block text-2xl font-black text-indigo-400 tracking-widest mt-1 font-mono">
                    {resetCode}
                  </span>
                  <span className="block text-[9px] text-slate-400 mt-2">
                    Default Password fallback matches{" "}
                    <strong className="text-slate-205">password</strong>
                  </span>
                </div>

                <button
                  onClick={() => handleTabChange("login")}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>RETURN TO SIGN IN</span>
                  <ArrowRight size={13} />
                </button>
              </motion.div>
            ) : (
              /* FORM FIELDS CONTENT */
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Full name (Visible on Sign Up) */}
                {authModalTab === "signup" && (
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        size={13}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Marcus Sterling"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                        id="auth-name-field"
                      />
                    </div>
                  </div>
                )}

                {/* Email (Always Visible) */}
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={13}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="email"
                      required
                      placeholder="marcus@sterling.co"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                      id="auth-email-field"
                    />
                  </div>
                </div>

                {/* Password (Visible on Login and Sign Up) */}
                {authModalTab !== "forgot" && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                        Password
                      </label>
                      {authModalTab === "login" && (
                        <button
                          type="button"
                          onClick={() => handleTabChange("forgot")}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold tracking-wide transition cursor-pointer"
                          id="auth-trigger-forgot"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock
                        size={13}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={
                          authModalTab === "login"
                            ? "••••••••"
                            : "Password (min. 6 characters)"
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                        id="auth-password-field"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff size={13} />
                        ) : (
                          <Eye size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Role Switch Cards (Visible only on Sign Up tab) */}
                {authModalTab === "signup" && (
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                      Access Role Level
                    </label>
                    <div
                      className="grid grid-cols-2 gap-3"
                      id="role-select-cards-grid"
                    >
                      <button
                        type="button"
                        onClick={() => setRole("customer")}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          role === "customer"
                            ? "bg-indigo-950/40 border-indigo-500 text-white"
                            : "bg-slate-950/45 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                        id="role-select-card-customer"
                      >
                        <User
                          size={16}
                          className={
                            role === "customer"
                              ? "text-indigo-400"
                              : "text-slate-500"
                          }
                        />
                        <div className="mt-3">
                          <span className="block text-xs font-bold leading-none">
                            Dine Client
                          </span>
                          <span className="block text-[9px] text-slate-450 mt-1">
                            Acquire reserve slots
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole("owner")}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          role === "owner"
                            ? "bg-indigo-950/40 border-indigo-500 text-white"
                            : "bg-slate-950/45 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                        id="role-select-card-owner"
                      >
                        <Building
                          size={16}
                          className={
                            role === "owner"
                              ? "text-indigo-400"
                              : "text-slate-500"
                          }
                        />
                        <div className="mt-3">
                          <span className="block text-xs font-bold leading-none">
                            Venue Vendor
                          </span>
                          <span className="block text-[9px] text-slate-450 mt-1">
                            Manage seat tables
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs tracking-wider rounded-xl shadow-lg shadow-indigo-950/20 hover:shadow-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    id="auth-submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw
                          size={13}
                          className="animate-spin text-white"
                        />
                        <span>PROCESSING...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {authModalTab === "login" && "SIGN IN TO PROFILE"}
                          {authModalTab === "signup" && "REGISTER ACCOUNT"}
                          {authModalTab === "forgot" &&
                            "REQUEST RESET INSTANTLY"}
                        </span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>

                {/* Extra Quick credentials helpful helper block to test out */}
                {authModalTab === "login" && (
                  <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-3 text-[10px] text-slate-400 leading-relaxed font-semibold">
                    <span className="text-indigo-400 uppercase font-bold block text-[8px] tracking-wider mb-0.5">
                      Quick Demo Logins
                    </span>
                    <p className="mb-0.5">
                      • Diner Profile:{" "}
                      <b className="text-slate-300">marcus@sterling.co</b> /{" "}
                      <span className="font-mono bg-slate-900 border border-slate-800 px-1 rounded">
                        password
                      </span>
                    </p>
                    <p>
                      • Chef Owner:{" "}
                      <b className="text-slate-300">
                        contact@sakuraomakase.com
                      </b>{" "}
                      /{" "}
                      <span className="font-mono bg-slate-900 border border-slate-800 px-1 rounded">
                        password
                      </span>
                    </p>
                  </div>
                )}

                {/* Footer Switch Tabs switches */}
                <div className="pt-4 border-t border-slate-850/60 flex justify-center items-center gap-1.5 text-xs text-slate-400">
                  {authModalTab === "login" && (
                    <>
                      <span>Don't have an authentication slot?</span>
                      <button
                        type="button"
                        onClick={() => handleTabChange("signup")}
                        className="text-indigo-400 hover:text-indigo-300 font-extrabold cursor-pointer"
                        id="auth-toggle-signup"
                      >
                        Register
                      </button>
                    </>
                  )}

                  {authModalTab === "signup" && (
                    <>
                      <span>Already possess an account?</span>
                      <button
                        type="button"
                        onClick={() => handleTabChange("login")}
                        className="text-indigo-400 hover:text-indigo-300 font-extrabold cursor-pointer"
                        id="auth-toggle-login"
                      >
                        Sign In
                      </button>
                    </>
                  )}

                  {authModalTab === "forgot" && (
                    <>
                      <span>Recall current account password?</span>
                      <button
                        type="button"
                        onClick={() => handleTabChange("login")}
                        className="text-indigo-400 hover:text-indigo-300 font-extrabold cursor-pointer"
                        id="auth-toggle-login-back"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
