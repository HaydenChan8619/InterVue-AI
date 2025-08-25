// app/api/stripe/session/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Make sure these env vars exist and are NOT client-exposed
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_API_VER = '2025-07-30.basil';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!STRIPE_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing critical env vars for stripe/session route');
  // We don't throw at import time, but errors will be clear in logs
}

const stripe = new Stripe(STRIPE_KEY, { apiVersion: STRIPE_API_VER });

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const session_id = url.searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    // Retrieve the checkout session (server-side)
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer_details']
    });

    // Optional: ensure mode/payment status
    if (session.mode !== 'payment' && session.mode !== undefined) {
      // not strictly necessary, but guards against weird sessions
    }

    // Require payment completed
    // Stripe uses session.payment_status === 'paid' for successful payments
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const customerEmail = session.customer_details?.email;
    if (!customerEmail) {
      return NextResponse.json({ error: 'No customer email on session' }, { status: 400 });
    }

    // Fetch current credits from your Supabase table (adjust table/column names)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('tokens_remaining')
      .eq('email', customerEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      // log detailed error (PGRST116 may mean no rows)
      console.error('Supabase error fetching credits:', error);
      return NextResponse.json({ error: 'Failed to fetch user credits' }, { status: 500 });
    }

    const credits = data?.tokens_remaining ?? 0;
    return NextResponse.json({ credits, email: customerEmail }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/stripe/session error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
