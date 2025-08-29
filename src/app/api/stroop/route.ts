import { NextRequest, NextResponse } from 'next/server';
import { insertStroopTrial, type StroopTrialData } from '@/lib/stroop-db';
import { incrementSessionTrials } from '@/lib/chat-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    console.log(`Stroop API called with action: ${action}, sessionId: ${data?.session_id}`);

    switch (action) {
      case 'insert_trial':
        await insertStroopTrial(data as StroopTrialData);
        
        // Increment total_trials counter in user_sessions
        try {
          await incrementSessionTrials(data.session_id);
          console.log(`Incremented total_trials for session: ${data.session_id}`);
        } catch (error) {
          console.error('Error incrementing session trials:', error);
        }
        
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Stroop API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
