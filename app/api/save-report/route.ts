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

    const { data: reportData, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert(payload)
      .select()
      .single();

    const actionDetails = {
      report_grade: reportGrade,
      report_details: reportDetails,
    };

    const { data: actionLogData, error: actionLogError } = await supabaseAdmin
      .from('action_log')
      .insert([{
        user_id: userId,
        type: 'interview_completed',
        details: actionDetails
      }])
      .select();

    if (reportError) {
      console.error('Supabase insert error (save-report):', reportError);
      return NextResponse.json({ error: 'Failed to save report', details: reportError }, { status: 500 });
    }

    if (actionLogError) {
      console.error('Supabase insert error (action_log):', actionLogError);
    }

    return NextResponse.json({ success: true, report: reportData }, { status: 201 });

  } catch (err) {
    console.error('Unexpected error in save-report:', err);
    return NextResponse.json({ error: 'Unexpected server error', details: String(err) }, { status: 500 });
  }
}
