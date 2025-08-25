import React, { Suspense } from 'react';
import BackgroundInfoClient from './BackgroundInfoClient';


export default function Page() {
return (
<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
  <BackgroundInfoClient />
</Suspense>
);
}