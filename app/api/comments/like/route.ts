import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  const userId = payload.user.id;

  try {
    const { commentId } = await request.json();

    if (!commentId || typeof commentId !== 'string') {
      return NextResponse.json({ success: false, message: 'commentId is required and must be a string' }, { status: 400 });
    }

    const result = await db.toggleCommentLike(commentId, userId);

    return NextResponse.json({
      success: true,
      status: result.newStatus,
      likeCount: result.likeCount,
    });

  } catch (error) {
    console.error('Error liking comment:', error);
    if (error instanceof Error && error.message === 'Comment not found') {
        return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
