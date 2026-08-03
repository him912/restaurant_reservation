/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, ArrowRight, RefreshCw, ShieldAlert } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/auth/verify-reset-token/${token}`,
        );
        setIsTokenValid(Boolean(response.data?.success));
      } catch (err) {
        setError(
          err?.response?.data?.message || "Invalid or expired reset link.",
        );
      } finally {
        setIsVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setIsVerifying(false);
      setError("Reset token is missing.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `${API_URL}/auth/reset-password/${token}`,
        { password },
        { headers: { "Content-Type": "application/json" } },
      );

      setSuccess(response.data?.message || "Password reset successful.");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to reset password. Please request a new link.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 pb-4 border-b border-slate-850 bg-gradient-to-r from-indigo-950/40 to-slate-900 text-center">
          <h1 className="text-xl font-black tracking-tight text-white uppercase">
            Reset Password
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Set a new password for your DineFlow account
          </p>
        </div>

        <div className="p-6 md:p-8">
          {isVerifying ? (
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-8">
              <RefreshCw size={16} className="animate-spin" />
              <span>Verifying reset link...</span>
            </div>
          ) : !isTokenValid ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-rose-950/40 text-rose-400 border border-rose-900/50 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert size={20} />
              </div>
              <p className="text-rose-300 text-sm">{error}</p>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                BACK TO HOME
              </button>
            </div>
          ) : success ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-emerald-400 text-sm font-semibold">{success}</p>
              <p className="text-slate-400 text-xs">Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-[11px] text-rose-300 font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    size={13}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={13}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>UPDATING...</span>
                  </>
                ) : (
                  <>
                    <span>RESET PASSWORD</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
