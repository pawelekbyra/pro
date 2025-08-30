import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { Slide } from '@/lib/types';

export const dynamic = 'force-dynamic';

const mockGrid: { [key: string]: Slide } = {
  '0,0': {
    id: 'mock_slide_1', x: 0, y: 0, type: 'video', userId: 'mock_user_1', username: 'Mock User',
    avatar: 'https://i.pravatar.cc/150?u=mock_user_1', access: 'public', createdAt: Date.now(),
    initialLikes: 10, isLiked: false, initialComments: 2,
    data: {
      description: 'Mock Video Slide at (0,0)',
      mp4Url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      hlsUrl: null, poster: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
    }
  },
  '0,1': {
    id: 'mock_slide_2', x: 0, y: 1, type: 'html', userId: 'mock_user_2', username: 'Another User',
    avatar: 'https://i.pravatar.cc/150?u=mock_user_2', access: 'public', createdAt: Date.now(),
    initialLikes: 5, isLiked: true, initialComments: 1,
    data: {
      htmlContent: '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 2rem; color: white; background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);">HTML Slide!</div>',
      description: 'Mock HTML Slide at (0,1)',
    }
  }
};

export async function GET(request: NextRequest) {
  if (process.env.MOCK_API === 'true') {
    await new Promise(resolve => setTimeout(resolve, 500));
    return NextResponse.json({ grid: mockGrid });
  }

  try {
    const { searchParams } = new URL(request.url);
    const x = parseInt(searchParams.get('x') || '0', 10);
    const y = parseInt(searchParams.get('y') || '0', 10);
    const width = parseInt(searchParams.get('width') || '3', 10);
    const height = parseInt(searchParams.get('height') || '3', 10);

    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
      return NextResponse.json({ error: 'Invalid viewport parameters' }, { status: 400 });
    }

    const payload = await verifySession();
    const userId = payload?.user?.id;

    const slides = await db.getSlidesInView({ x, y, width, height, currentUserId: userId });
    const grid: { [key: string]: any } = {};
    slides.forEach(slide => {
      const key = `${slide.x},${slide.y}`;
      grid[key] = slide;
    });

    return NextResponse.json({ grid });

  } catch (error) {
    console.error('Error fetching slides:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
