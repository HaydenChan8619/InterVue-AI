'use client'

import LandingHero from './LandingHero';
import LandingTestimonials from './LandingTestimonials';
import LandingCallToAction from './LandingCallToAction';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50">
      <LandingHero />
      {/*<LandingTestimonials />*/}
      <LandingCallToAction />
    </div>
  );
}