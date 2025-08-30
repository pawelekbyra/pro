import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { mockDb } from '@/lib/mock-db';
import { Video } from '@/lib/db';

// These types are now defined locally to keep this old endpoint functional
// after the main data model refactoring.
type HydratedVideo = Video & {
  initialLikes: number;
  isLiked: boolean;
  initialComments: number;
};
type Slide = HydratedVideo & {
  x: number;
  y: number;
};
type Grid = {
  [key: string]: Slide;
};


export const dynamic = 'force-dynamic';

// A mock grid is needed for the MOCK_API case.
// We'll create a simple one here.
const mockGrid: Grid = {
  '0,0': {
    id: 'video_mock_1',
    userId: 'user_mock_1',
    username: 'TestUser',
    description: 'Pionowy slajd 1 (0,0). Przesuń w dół!',
    mp4Url: 'https://vod-progressive.pexels.com/video/856077/free-video-856077.mp4',
    hlsUrl: 'https://content.jwplatform.com/manifests/vM7nH0Kl.m3u8',
    poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_1',
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 1337,
    isLiked: false,
    initialComments: 42,
    x: 0,
    y: 0,
  }
};

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