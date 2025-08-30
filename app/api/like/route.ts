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

    // --- MOCK API LOGIC (currently broken due to refactor) ---
    if (process.env.MOCK_API === 'true') {
      // This part is hard to mock without a full mock DB state.
      // We'll just return a successful response for now.
      return NextResponse.json({
        success: true,
        isLiked: true,
        likeCount: 1,
      });
    }
    // --- END MOCK API LOGIC ---

    const result = await db.toggleLike(slideId, currentUser.id);

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
