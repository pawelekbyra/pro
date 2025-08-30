import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await verifySession();
    const userId = payload?.user?.id;

    // Use the new, refactored db function
    const videos = await db.getVideos({ currentUserId: userId });

    // Return the data under a 'videos' key
    return NextResponse.json({ videos });

  } catch (error) {
    console.error('Error reading videos data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
