import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { mockGrid, Grid, Slide, HydratedVideo } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  // If mock API is enabled, return mock data
  if (process.env.MOCK_API === 'true') {
    // We add a short delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return NextResponse.json({ grid: mockGrid });
  }

  try {
    const payload = await verifySession();
    const userId = payload?.user?.id;

    // Use the new, refactored db function
    const videos = await db.getVideos({ currentUserId: userId });

    // Transform the videos array into a grid
    const grid: Grid = {};
    videos.forEach((video, index) => {
      const slide: Slide = {
        ...(video as HydratedVideo),
        x: 0,
        y: index,
      };
      grid[`0,${index}`] = slide;
    });

    // Return the data in grid format
    return NextResponse.json({ grid });

  } catch (error) {
    console.error('Error reading videos data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
