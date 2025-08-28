import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

// IMPORTANT: This should be moved to a .env.local file for security
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

// Mock user data - in a real app, this would come from a database
const MOCK_USER = {
  username: 'admin',
  password: 'password123',
  profile: {
    displayName: 'Paweł Polutek',
    email: 'admin@example.com',
    avatar: 'https://i.pravatar.cc/100?u=pawel',
    // These fields are needed by the ProfileTab component
    firstName: 'Paweł',
    lastName: 'Polutek',
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (username === MOCK_USER.username && password === MOCK_USER.password) {
      // Create the session token (JWT)
      const token = await new SignJWT({ user: MOCK_USER.profile })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      // Set the session cookie
      cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      return NextResponse.json({ success: true, user: MOCK_USER.profile });
    }

    return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred' }, { status: 500 });
  }
}
