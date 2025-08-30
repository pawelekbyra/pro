import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  const userId = payload.user.id;

  try {
    const { commentId } = await request.json();

    if (!commentId) {
      return NextResponse.json({ success: false, message: 'commentId is required' }, { status: 400 });
    }

    // This will be implemented in the mock db layer later.
    // For now, we assume it exists and works.
    // const result = await db.toggleCommentLike(commentId, userId);

    // For now, just return success
    return NextResponse.json({ success: true, status: 'toggled' });

  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
