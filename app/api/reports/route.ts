// app/api/reports/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // read NextAuth token from cookie
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const email = token.email as string;

    // find user_id in users table
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Error finding user by email', userError);
      return NextResponse.json({ error: 'Failed to verify user' }, { status: 500 });
    }
    if (!userRow?.user_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const userId = userRow.user_id;

    // fetch reports for this user
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('report_id, created_at, report_grade, report_details')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching reports', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (err) {
    console.error('Unexpected error in GET /api/reports', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
