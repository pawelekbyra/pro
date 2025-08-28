import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

export async function GET(req: NextRequest) {
  const sessionCookie = cookies().get(COOKIE_NAME);

  if (!sessionCookie) {
    return NextResponse.json({ isLoggedIn: false, user: null });
  }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);

    const user = payload.user;

    if (!user) {
        return NextResponse.json({ isLoggedIn: false, user: null });
    }

    // No need to cast here as we are just passing it through,
    // but it's good practice to ensure the structure if we were to use it.
    // For now, the 'unknown' type is acceptable for the response body.
    // The build error happens when you try to *access properties* on an unknown type.
    return NextResponse.json({ isLoggedIn: true, user: user });
  } catch (error) {
    console.error('Session verification failed:', error);
    return NextResponse.json({ isLoggedIn: false, user: null });
  }
}
