/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Toast = () => {
  const { toast, hideToast } = useApp();

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.message, hideToast]);

  return (
    <AnimatePresence>
      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full" id="toast-wrapper">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`shadow-2xl rounded-2xl border p-4 flex items-start gap-3 backdrop-blur-md bg-white/95 text-zinc-950 border-zinc-100`}
            id="toast-container"
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} id="toast-icon-success" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} id="toast-icon-error" />
            )}
            {toast.type === 'info' && (
              <Info className="text-amber-500 shrink-0 mt-0.5" size={20} id="toast-icon-info" />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium pr-4">{toast.message}</p>
            </div>

            <button
              onClick={hideToast}
              className="text-zinc-400 hover:text-zinc-900 transition-colors p-1 rounded-lg hover:bg-zinc-100"
              aria-label="Close notification"
              id="toast-close-button"
            >
              <X size={15} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
