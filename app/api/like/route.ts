import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { UserPayload } from '@/lib/types';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

async function verifySession(req: NextRequest) {
    const sessionCookie = cookies().get(COOKIE_NAME);
    if (!sessionCookie) return null;
    try {
        const { payload } = await jwtVerify<UserPayload>(sessionCookie.value, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function POST(request: NextRequest) {
  const payload = await verifySession(request);
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required to like a post.' }, { status: 401 });
  }
  const currentUser = payload.user;

  try {
    const { likeId } = await request.json();

    if (!likeId) {
      return NextResponse.json({ success: false, message: 'likeId is required' }, { status: 400 });
    }

    const result = await db.toggleLike(likeId, currentUser.id);

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
