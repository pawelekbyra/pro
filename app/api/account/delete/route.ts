import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

interface UserPayload {
    user: {
        id: string;
        [key: string]: any;
    }
}

async function verifySession(req: NextRequest) {
    const sessionCookie = cookies().get(COOKIE_NAME);
    if (!sessionCookie) return null;
    try {
        const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
        return payload as UserPayload;
    } catch (error) {
        return null;
    }
}

export async function POST(request: NextRequest) {
  const payload = await verifySession(request);
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { confirm_text } = await request.json();

    if (confirm_text !== 'USUWAM KONTO') {
      return NextResponse.json({ success: false, message: 'Confirmation text is incorrect.' }, { status: 400 });
    }

    const wasDeleted = await db.deleteUser(payload.user.id);

    if (!wasDeleted) {
        return NextResponse.json({ success: false, message: 'User not found or could not be deleted.' }, { status: 404 });
    }

    // Clear the session cookie to log the user out
    cookies().delete(COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. You have been logged out.',
    });

  } catch (error) {
    console.error('Error in account delete API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
