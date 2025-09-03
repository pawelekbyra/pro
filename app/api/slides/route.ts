import { NextRequest, NextResponse } from 'next/server';
import { Slide } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const x = searchParams.get('x');
  const y = searchParams.get('y');

  if (x === '0' && y === '0') {
    // Return a single slide object for (0,0)
    const slide: Slide = {
      id: '1',
      type: 'video',
      x: 0,
      y: 0,
      initialLikes: 123,
      initialComments: 45,
      isLiked: false,
      avatar: '/avatars/placeholder.png',
      userId: 'user_placeholder',
      username: 'placeholder',
      access: 'public',
      createdAt: Date.now(),
      data: {
        hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        mp4Url: '',
        poster: 'https://image.mux.com/x36xhzz/thumbnail.jpg',
        title: 'Example Video',
        description: 'This is an example video slide.'
      }
    };
    return NextResponse.json({ slide });
  }

  // Old grid functionality is no longer supported
  return NextResponse.json({ error: 'Grid view is no longer supported. Please specify x=0 and y=0.' }, { status: 400 });
}