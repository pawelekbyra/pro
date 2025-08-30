import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { mockGrid, Grid, Slide, HydratedVideo } from '@/lib/mock-data';
import { mockDb } from '@/lib/mock-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // If mock API is enabled, return mock data
  if (process.env.MOCK_API === 'true') {
    // We add a short delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return NextResponse.json({ grid: mockGrid, videos: mockDb.videos });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10); // A smaller limit for infinite scroll
    const start = (page - 1) * limit;

    const payload = await verifySession();
    const userId = payload?.user?.id;

    // Use the new, refactored db function with pagination
    const videos = await db.getVideos({
      currentUserId: userId,
      start,
      count: limit,
    });

    // Transform the videos array into a grid
    const grid: Grid = {};
    videos.forEach((video, index) => {
      const slide: Slide = {
        ...(video as HydratedVideo),
        x: 0,
        y: index + start, // Use start to offset the y-coordinate for correct positioning
      };
      grid[`0,${index + start}`] = slide;
    });

    // Return the data in grid format
    return NextResponse.json({ grid, videos });

  } catch (error) {
    console.error('Error reading videos data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}