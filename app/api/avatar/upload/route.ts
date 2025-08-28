import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

async function verifySession(req: NextRequest) {
    const sessionCookie = cookies().get(COOKIE_NAME);
    if (!sessionCookie) return null;
    try {
        const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function POST(request: NextRequest) {
  const payload = await verifySession(request);
  if (!payload) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { image } = body;

    if (!image || !image.startsWith('data:image/')) {
      return NextResponse.json({ success: false, message: 'Invalid image data' }, { status: 400 });
    }

    // In a real app, you would:
    // 1. Decode the base64 image.
    // 2. Upload it to a storage service (like S3).
    // 3. Get the new URL.
    // 4. Update the user's record in the database with the new URL.

    // For this mock, we'll just return the data URL itself.
    // This allows the frontend to display the cropped image immediately.
    return NextResponse.json({
      success: true,
      data: {
        url: image, // Return the base64 data URL
      },
    });

  } catch (error) {
    console.error('Error in avatar upload API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
