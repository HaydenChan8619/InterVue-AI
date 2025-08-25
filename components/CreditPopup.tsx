'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type Props = {
  open: boolean;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message?: string;
  onClose: () => void;
  autoCloseMs?: number | null; // set to null to disable auto-close
  // optional action button (text + callback)
  actionLabel?: string;
  onAction?: () => void;
};

export default function CreditPopup({
  open,
  type = 'info',
  title,
  message,
  onClose,
  autoCloseMs = null,
  actionLabel,
  onAction,
}: Props) {
  const [localOpen, setLocalOpen] = useState(open);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // sync open prop -> localOpen to allow animate exit
  useEffect(() => setLocalOpen(open), [open]);

  // auto-close timer
  useEffect(() => {
    if (!localOpen || !autoCloseMs) return;
    const t = setTimeout(() => handleClose(), autoCloseMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localOpen, autoCloseMs]);

  // ESC key closes
  useEffect(() => {
    if (!localOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localOpen]);

  // focus the dialog when it opens
  useEffect(() => {
    if (localOpen) dialogRef.current?.focus();
  }, [localOpen]);

  const handleClose = () => {
    setLocalOpen(false);
    // let animation run then call parent's onClose after short delay to keep UX snappy
    setTimeout(() => onClose?.(), 220);
  };

  const icon = type === 'success' ? (
    <CheckCircle2 className="h-7 w-7 text-green-600" />
  ) : type === 'error' ? (
    <AlertTriangle className="h-7 w-7 text-red-600" />
  ) : (
    <Info className="h-7 w-7 text-indigo-600" />
  );

  return (
    <AnimatePresence>
      {localOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-20">
          {/* overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* toast/modal card */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-[min(640px,96%)] max-w-xl pointer-events-auto rounded-2xl bg-white border border-slate-100 shadow-xl"
          >
            <div className="p-5 flex gap-4">
              <div className="flex items-start">{icon}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {title ?? (type === 'success' ? 'Success' : type === 'error' ? 'Something went wrong' : 'Notice')}
                    </h3>
                    {message && (
                      <p className="mt-1 text-md font-semibold text-slate-600 whitespace-pre-wrap">{message}</p>
                    )}
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={handleClose}
                      aria-label="Close"
                      className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* actions 
                {(actionLabel && onAction) && (
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => {
                        onAction();
                        handleClose();
                      }}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {actionLabel}
                    </button>

                    <button
                      onClick={handleClose}
                      className="text-sm px-3 py-1 rounded-md text-slate-600 hover:bg-slate-50"
                    >
                      Dismiss
                    </button>
                  </div>
                )}*/}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
