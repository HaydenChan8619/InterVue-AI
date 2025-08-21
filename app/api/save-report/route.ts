// app/api/save-report/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId = null, reportGrade = null, reportDetails = null } = body;

    // Basic validation
    if (!reportDetails) {
      return NextResponse.json({ error: 'reportDetails is required' }, { status: 400 });
    }

    const payload = {
      user_id: userId, // can be null if not signed in
      report_grade: reportGrade,
      report_details: reportDetails,
    };

    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error (save-report):', error);
      return NextResponse.json({ error: 'Failed to save report', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: data }, { status: 201 });

  } catch (err) {
    console.error('Unexpected error in save-report:', err);
    return NextResponse.json({ error: 'Unexpected server error', details: String(err) }, { status: 500 });
  }
}
