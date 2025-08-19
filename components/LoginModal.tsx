"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { X } from "lucide-react";
import { signIn } from "next-auth/react";

type Props = {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
};

export default function LoginModal({
  open,
  onClose,
  redirectTo = typeof window !== "undefined"
    ? window.location.origin + "/backgroundinfo"
    : "/backgroundinfo",
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const startGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // NextAuth handles redirect & session automatically
      await signIn("google", { callbackUrl: redirectTo });
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err?.message ?? "Sign in failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        role="dialog"
        aria-modal="true"
        className="relative w-[min(420px,92%)] bg-white rounded-2xl shadow-xl border border-indigo-100 p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-indigo-600">
              Sign in to continue
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Login to get started with InterVue AI
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={startGoogle}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-3 px-4 py-2 rounded-xl font-medium transition ${
              isLoading
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-white border border-slate-200 hover:bg-indigo-50"
            }`}
          >
            <FcGoogle className="h-5 w-5" />
            <span>{isLoading ? "Redirecting…" : "Continue with Google"}</span>
          </button>

          {error && (
            <div className="mt-3 text-sm text-red-600">{error}</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
