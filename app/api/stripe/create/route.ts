// app/api/stripe/create/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-07-30.basil' });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { price, label, packageId, credits, customerEmail, currency = 'CAD' } = body;

    const unitAmount = Math.round(parseFloat(price) * 100); // cents
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/backgroundinfo?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/buy-credits`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${label} Credit Package (${credits} credits)`,
              metadata: { packageId },
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      // include relevant metadata so webhook can fulfill
      metadata: {
        packageId: packageId,
        credits: String(credits),
      },
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe create session error', err);
    return new NextResponse(JSON.stringify({ error: err?.message || 'Server error' }), { status: 500 });
  }
}
