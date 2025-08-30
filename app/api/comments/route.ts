import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { verifySession } from '@/lib/auth';

import { mockDb } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ success: false, message: 'videoId is required' }, { status: 400 });
  }

  // --- MOCK API LOGIC ---
  if (process.env.MOCK_API === 'true') {
    const comments = mockDb.comments.filter(c => c.videoId === videoId);
    return NextResponse.json({ success: true, comments });
  }
  // --- END MOCK API LOGIC ---

  try {
    // The db function is already refactored, just need to pass videoId.
    const comments = await db.getComments(videoId);
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required to comment.' }, { status: 401 });
  }
  const currentUser = payload.user;

  try {
    const { videoId, text } = await request.json();

    if (!videoId || !text) {
      return NextResponse.json({ success: false, message: 'videoId and text are required' }, { status: 400 });
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json({ success: false, message: 'Comment text cannot be empty.' }, { status: 400 });
    }

    // --- MOCK API LOGIC ---
    if (process.env.MOCK_API === 'true') {
        const newComment = {
            id: `comment_mock_${Date.now()}`,
            videoId,
            userId: currentUser.id,
            text: text.trim(),
            createdAt: Date.now(),
            likedBy: [],
            user: {
                displayName: currentUser.displayName,
                avatar: currentUser.avatar,
            }
        };
        mockDb.comments.unshift(newComment); // Add to the beginning of the array

        // Also increment the comment count on the video
        const video = mockDb.videos.find(v => v.id === videoId);
        if (video) {
            video.initialComments += 1;
        }

        return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
    }
    // --- END MOCK API LOGIC ---

    // The db function is already refactored, just need to pass videoId.
    const newComment = await db.addComment(videoId, currentUser.id, text.trim());

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });

  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
