import { NextRequest, NextResponse } from 'next/server';
import { insertStroopTrial, createStroopSession, updateStroopSession, type StroopTrialData } from '@/app/lib/stroop-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'insert_trial':
        await insertStroopTrial(data as StroopTrialData);
        return NextResponse.json({ success: true });

      case 'create_session':
        const { userId, sessionId } = data;
        await createStroopSession(userId, sessionId);
        return NextResponse.json({ success: true });

      case 'update_session':
        const { sessionId: updateSessionId, totalTrials, endTime } = data;
        await updateStroopSession(updateSessionId, totalTrials, endTime);
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
