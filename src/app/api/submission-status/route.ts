import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('user_id');
		const path = searchParams.get('path');
		if (!userId || !path) {
			return NextResponse.json({ success: false, error: 'Missing user_id or path' }, { status: 400 });
		}

		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase
			.from('user_sessions')
			.select('submitted_result, submit_time')
			.eq('user_id', userId)
			.eq('route_path', path)
			.not('submitted_result', 'is', null)
			.limit(1);

		if (error) {
			console.error('submission-status query error:', error);
			return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 });
		}

		const submitted = Array.isArray(data) && data.length > 0;
		return NextResponse.json({ success: true, submitted });
	} catch (err) {
		console.error('submission-status GET error:', err);
		return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
	}
}


