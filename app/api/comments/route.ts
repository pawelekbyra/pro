import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slideId = searchParams.get('slideId');

  if (!slideId) {
    return NextResponse.json({ success: false, message: 'slideId is required' }, { status: 400 });
  }

  try {
    const comments = await db.getComments(slideId);
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
    const { slideId, text } = await request.json(); // parentId is not supported by the real db function

    if (!slideId || !text) {
      return NextResponse.json({ success: false, message: 'slideId and text are required' }, { status: 400 });
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json({ success: false, message: 'Comment text cannot be empty.' }, { status: 400 });
    }

    // Use the real db.addComment
    const newComment = await db.addComment(slideId, currentUser.id, text.trim());

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });

  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
