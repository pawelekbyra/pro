import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockDb } from '@/lib/mock-db';

export const dynamic = 'force-dynamic';
import { verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required to like a post.' }, { status: 401 });
  }
  const currentUser = payload.user;

  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json({ success: false, message: 'videoId is required' }, { status: 400 });
    }

    // --- MOCK API LOGIC ---
    if (process.env.MOCK_API === 'true') {
      const video = mockDb.videos.find(v => v.id === videoId);

      if (!video) {
        return NextResponse.json({ success: false, message: 'Video not found' }, { status: 404 });
      }

      video.isLiked = !video.isLiked;
      video.initialLikes += video.isLiked ? 1 : -1;

      return NextResponse.json({
        success: true,
        isLiked: video.isLiked,
        likeCount: video.initialLikes,
      });
    }
    // --- END MOCK API LOGIC ---

    const result = await db.toggleLike(videoId, currentUser.id);

    return NextResponse.json({
      success: true,
      isLiked: result.newStatus === 'liked',
      likeCount: result.likeCount,
    });

  } catch (error) {
    console.error('Error in like API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
