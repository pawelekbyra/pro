import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ success: false, message: 'videoId is required' }, { status: 400 });
  }

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

    // The db function is already refactored, just need to pass videoId.
    const newComment = await db.addComment(videoId, currentUser.id, text.trim());

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });

  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
