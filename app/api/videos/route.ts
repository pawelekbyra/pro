import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { mockVideos } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  // If mock API is enabled, return mock data
  if (process.env.MOCK_API === 'true') {
    // We add a short delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return NextResponse.json({ videos: mockVideos });
  }

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
