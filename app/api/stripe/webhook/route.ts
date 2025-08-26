// app/api/stripe/webhook/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

export const runtime = 'nodejs'; // ensure node runtime (if needed)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-07-30.basil' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    console.log('inside post');
  const sig = req.headers.get('stripe-signature') || '';
  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;

  try {
    
    event = stripe.webhooks.constructEvent(
    buf, 
    sig, 
    webhookSecret
    );
  } catch (err: any) {
    console.error("❌ Stripe signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    console.log('webhook confirm checkout success');
    const session = event.data.object as Stripe.Checkout.Session;
    const credits = parseInt(session.metadata?.credits || "0", 10);
    const customerEmail = session.customer_details?.email ?? null;

    if (customerEmail && credits > 0) {
      try {
        // Safely increment tokens using an RPC function
        const { error } = await supabaseAdmin.rpc("increment_tokens", {
          email: customerEmail,
          credits,
        });

        const actionDetails = {
          credits_purchased: credits,
        };

        const { data: user, error: usersError } = await supabaseAdmin
          .from('users')
          .select('user_id, email')
          .eq('email', customerEmail)
          .limit(1);

        const { data: actionLogData, error: actionLogError } = await supabaseAdmin
          .from('action_log')
          .insert([{
            user_id: user?.[0].user_id,
            type: 'purchase_completed',
            details: actionDetails
          }])
          .select();

        if (error) {
          console.error("❌ Supabase update error:", error);
        } else {
          console.log(`✅ Added ${credits} tokens to ${customerEmail}`);
        }

        if (actionLogError) {
        console.error("❌ Unexpected error updating action log:", actionLogError);
        }
      } catch (err) {
        console.error("❌ Unexpected error updating Supabase:", err);
      } 
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}