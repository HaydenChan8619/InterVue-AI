// app/api/reports/[reportId]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  context: { params: { reportId: string } } // <-- correct typing
) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const email = token.email as string;

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
    const reportId = context.params.reportId; // <-- access here

    if (!reportId) {
      return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('report_id, created_at, report_grade, report_details')
      .eq('user_id', userId)
      .eq('report_id', reportId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching report', error);
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ report: data });
  } catch (err) {
    console.error('Unexpected error in GET /api/reports/[reportId]', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
