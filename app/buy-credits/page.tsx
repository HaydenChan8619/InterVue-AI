'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Variants } from "framer-motion";

type Package = {
  id: string;
  label: string;
  price: string; // "3.00"
  displayPrice: string; // "$3"
  credits: number;
  subtitle?: string;
};


const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.25,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",   // ✅ valid type
      ease: "easeOut",
      duration: 0.8,
    },
  },
};
const PACKAGES: Package[] = [
  { id: 'small', label: 'Starter', price: '3.00', displayPrice: '$3', credits: 3, subtitle: '$1 per credit' },
  { id: 'medium', label: 'Value', price: '6.00', displayPrice: '$6', credits: 8, subtitle: '$0.75 per credit' },
  { id: 'large', label: 'Pro', price: '10.00', displayPrice: '$10', credits: 20, subtitle: '$0.50 per credit' },
];

export default function BuyCreditsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<Package>(PACKAGES[1]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [doneAnimations, setDoneAnimations] = useState<boolean[]>(() => Array(PACKAGES.length).fill(false));

  useEffect(() => {
    // Ensure doneAnimations length matches PACKAGES length
    setDoneAnimations((prev) => (prev.length === PACKAGES.length ? prev : Array(PACKAGES.length).fill(false)));
  }, []);

  const handlePay = async () => {
    if (!session) {
      setMessage('You must be signed in to purchase.');
      return;
    }
    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch('/api/stripe/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.user_id,
          price: selected.price,
          label: selected.label,
          packageId: selected.id,
          credits: selected.credits,
          customerEmail: session.user?.email ?? undefined,
          currency: 'CAD'
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create Stripe session');

      window.location.href = json.url;
    } catch (err: any) {
      setMessage('Payment error: ' + (err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto pt-32 pb-16">
        {/* Header with entrance animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={fadeUp} className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Unlock Your Interview Potential</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Purchase AI interview credits and practice with our advanced interview simulator
            </p>
          </motion.div>

        {/* Packages grid - each card animates simultaneously (no stagger) */}
          <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-8 mb-12">
          {PACKAGES.map((p, idx) => {
            const isSelected = selected.id === p.id;

            return (
              <motion.div
                key={p.id}
                // keep initial scale identical to final scale to prevent transform jumps
                initial={{ opacity: 0, y: 20, scale: 1 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isSelected ? 1.02 : 1,
                }}
                // pick transition based on whether the initial entrance finished
                transition={doneAnimations[idx]
                  ? { type: 'tween', ease: 'easeOut', duration: 0.2 } // normal / off-hover transition
                  : { type: 'tween', ease: 'easeOut', duration: 0.8 } // initial entrance transition
                }
                // hover uses its own short transition (0.2s)
                whileHover={
                  doneAnimations[idx]
                    ? {
                        scale: isSelected ? 1.06 : 1.04,
                        y: -6,
                        filter: 'drop-shadow(0 10px 20px rgba(79,70,229,0.10))',
                        transition: { type: 'tween', ease: 'easeOut', duration: 0.2 },
                      }
                    : {}
                }
                // tap uses a quick transition as well
                whileTap={{ scale: isSelected ? 0.995 : 0.98, transition: { duration: 0.12 } }}
                onAnimationComplete={() => {
                  // when the entrance animation finishes, mark this card as "entered"
                  setDoneAnimations((prev) => {
                    if (prev[idx]) return prev; // already set — avoid needless updates
                    const next = [...prev];
                    next[idx] = true;
                    return next;
                  });
                }}
                onClick={() => setSelected(p)}
                role="button"
                aria-pressed={isSelected}
                className={`relative flex flex-col rounded-3xl p-8 shadow-lg border-2 transition-colors duration-200 cursor-pointer h-full ${
                  isSelected ? 'border-indigo-500 bg-white' : 'border-indigo-100 bg-white/90'
                }`}
                style={{ willChange: 'transform, opacity, filter' }}
              >

                {/* Popular badge */}
                {p.id === 'medium' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex flex-col items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">{p.label}</h3>
                  <p className="text-sm text-slate-500 mt-1">{p.subtitle}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-extrabold text-indigo-600">{p.displayPrice}</div>
                  <div className="text-sm text-slate-600 mt-1">{p.credits} interview credits</div>
                </div>

                <div className="bg-indigo-50 rounded-xl p-4 mb-6 text-center">
                  <div className="text-sm text-indigo-700">
                    {p.credits <= 3
                      ? 'Perfect for trying out the platform'
                      : p.credits <= 8
                        ? 'Ideal for thorough interview preparation'
                        : 'Best value for extensive practice'}
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-grow">
                  {p.credits <= 3 ? (
                    <>
                      <li className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        3 full interview simulations
                      </li>
                      <li className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Report History
                      </li>
                      <li className="flex items-center text-sm text-slate-600 opacity-0">
                        {/* Hidden spacer item to maintain consistent height */}
                        &nbsp;
                      </li>
                    </>
                  ) : p.credits <= 8 ? (
                    <>
                      <li className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        8 full interview simulations
                      </li>
                      <li className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Report History
                      </li>
                      <li className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Performance Analytics
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        20 full interview simulations
                      </li>
                      <li className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Report History
                      </li>
                      <li className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Performance Analytics
                      </li>
                      <li className="flex items-center text-sm text-slate-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Priority support
                      </li>
                    </>
                  )}
                </ul>

                {/* Select button: use framer-motion for hover/tap */}
                <motion.button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelected(p); }}
                  className={`w-full py-3 rounded-xl font-medium mt-auto ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Pay area (fade in) */}
        {/*<motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.8 }}
          className="bg-white rounded-3xl shadow-lg border border-indigo-100 overflow-hidden"
        >*/}
        <motion.div variants={fadeUp} className="bg-white rounded-3xl shadow-lg border border-indigo-100 overflow-hidden">
          <div className="md:flex">
            <div className="md:w-2/3 p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-indigo-600">Complete Your Purchase</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {selected.label} — {selected.credits} credits · {selected.displayPrice}
                  </p>
                </div>

                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-sm text-slate-500">Account</p>
                  <p className="text-sm font-medium text-indigo-700">{session?.user?.name ?? 'Not signed in'}</p>
                </div>
              </div>

              {!session ? (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-slate-600">You must sign in to purchase credits.</p>
                  </div>

                  <motion.button
                    onClick={() => signIn('google')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'tween', duration: 0.12 }}
                    className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-medium py-3 px-6 rounded-xl transition duration-200 shadow-sm"
                  >
                    Sign in with Google
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div>
                    <motion.button
                      onClick={handlePay}
                      disabled={loading}
                      whileHover={loading ? {} : { scale: 1.02 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'tween', duration: 0.12 }}
                      className="w-full py-3 rounded-xl font-medium bg-indigo-600 text-white disabled:opacity-50"
                    >
                      {loading ? 'Redirecting…' : 'Proceed to Payment'}
                    </motion.button>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <h4 className="text-lg font-medium text-indigo-700 mb-4">Order Summary</h4>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-600">Credits</span>
                      <span className="text-sm font-medium text-slate-700">{selected.credits}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-600">Price per credit</span>
                      <span className="text-sm font-medium text-slate-700">
                        ${(parseFloat(selected.displayPrice.replace('$', '')) / selected.credits).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 mt-4 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-medium">Total</span>
                        <span className="text-xl font-bold text-indigo-700">{selected.displayPrice}</span>
                      </div>
                      <div className="mt-4 text-xs text-slate-500">
                        By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {message && (
                <div className={`mt-6 p-4 rounded-lg text-center text-sm ${
                  message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {message}
                </div>
              )}
            </div>

            <div className="md:w-1/3 bg-indigo-50 p-8 flex flex-col justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-xl mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">Secure Payment</h3>
                <p className="text-sm text-slate-600 mb-6">
                  All transactions are secure and encrypted. We never store your payment details.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
}
