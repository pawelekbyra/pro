import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';
const MOCK_USER_PASSWORD = 'password123'; // From the login route mock

interface UserProfile {
  [key: string]: any;
}

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
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // --- Validation ---
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }

    // In a real app, you would verify this against a hashed password in the DB
    if (currentPassword !== MOCK_USER_PASSWORD) {
        return NextResponse.json({ success: false, message: 'Incorrect current password.' }, { status: 403 });
    }

    if (newPassword.length < 8) {
        return NextResponse.json({ success: false, message: 'New password must be at least 8 characters long.' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'New passwords do not match.' }, { status: 400 });
    }

    const user = payload.user as UserProfile;
    console.log('Mock password change successful for user:', user);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully!',
    });

  } catch (error) {
    console.error('Error in password change API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
