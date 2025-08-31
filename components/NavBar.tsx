'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn, signOut, useSession } from "next-auth/react";

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleLogin = () => {
    const redirectTo =
      typeof window !== "undefined"
        ? window.location.origin + "/backgroundinfo"
        : "/backgroundinfo";

    signIn("google", { callbackUrl: redirectTo });
  };

  const handleGetHome = () => router.push('/');
  const goToDashboard = () => router.push('/dashboard');
  const goToBuy = () => {
    if (!session) {
      handleLogin();
      return;
    }
    router.push('/buy-credits');
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
      role="navigation"
      aria-label="Main"
      style={{ zIndex: 2147483647, top: 0 }}
    >
      <div className="container mx-auto px-6 md:px-16 flex items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={handleGetHome}
          aria-label="Go home"
        >
          <div className="rounded-lg p-1 bg-white/0 transition-transform duration-200 hover:scale-105">
            <Image src="/logo.png" width={40} height={40} alt="InterVue AI Logo" className="pt-2" />
          </div>
          <span className="text-xl font-bold text-indigo-600">InterVue AI</span>
        </div>

        {/*<div className="hidden md:flex space-x-8">
          <a href="#process" className="text-indigo-900 hover:text-indigo-600 font-medium transition-transform duration-200 hover:scale-105">How It Works</a>
          <a href="#testimonials" className="text-indigo-900 hover:text-indigo-600 font-medium transition-transform duration-200 hover:scale-105">Testimonials</a>
          <a href="#pricing" className="text-indigo-900 hover:text-indigo-600 font-medium transition-transform duration-200 hover:scale-105">Pricing</a>
        </div>*/}

        <div className="flex items-center space-x-3">
          {session?.user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="flex items-center gap-2 border border-indigo-400 text-indigo-700 font-medium py-1.5 px-3 rounded-lg transition transform hover:scale-105"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                {session.user.image ? (
                  <Image src={session.user.image} width={36} height={36} alt="Profile" className="rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {session.user.name ? session.user.name.charAt(0) : 'U'}
                  </div>
                )}
                <span className="hidden md:inline-block">{session.user.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-indigo-900">{session.user.name}</div>
                    <div className="text-xs text-gray-500"> {`Credits: ${(session.user as any).tokens_remaining ?? 0}`}</div>
                  </div>

                  <button
                    onClick={() => { setMenuOpen(false); goToDashboard(); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Dashboard
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); goToBuy(); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Buy Credits
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' });}}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105"
              onClick={handleLogin}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

    <style jsx global>{`
      /* make sure header is above most overlays */
      nav[role="navigation"] {
        position: fixed; /* ensure nav participates in stacking with this z-index */
        top: 0;
      }

      /* Target common PayPal injected nodes/iframes and push them behind the header */
      iframe[src*="paypal.com"],
      iframe[src*="paypalobjects.com"],
      .paypal-button-container,
      .paypal-buttons,
      .paypal-payments,
      [id^="__paypal"] {
        z-index: 1 !important;
        position: relative !important;
      }

      /* If PayPal uses a fixed overlay wrapper, lower it too */
      div[id*="paypal"], div[class*="paypal"] {
        z-index: 1 !important;
        position: relative !important;
      }
    `}</style>
    </nav>
  );
}

export default NavBar;