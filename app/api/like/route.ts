import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required to like a post.' }, { status: 401 });
  }
  const currentUser = payload.user;

  try {
    const { slideId } = await request.json();

    if (!slideId) {
      return NextResponse.json({ success: false, message: 'slideId is required' }, { status: 400 });
    }

    const slide = await db.getSlide(slideId);
    if (!slide) {
      return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }

    const result = await db.toggleLike(slideId, currentUser.id);

    return NextResponse.json({
      success: true,
      newStatus: result.newStatus,
      likeCount: result.likeCount,
    });

  } catch (error) {
    console.error('Error in like API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
