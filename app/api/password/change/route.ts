import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { UserPayload } from '@/lib/types';
import bcrypt from 'bcryptjs';

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
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // --- Validation ---
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }
    if (newPassword.length < 8) {
        return NextResponse.json({ success: false, message: 'New password must be at least 8 characters long.' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'New passwords do not match.' }, { status: 400 });
    }

    // --- Logic ---
    const userFromDb = await db.findUserById(payload.user.id);
    if (!userFromDb) {
        return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, userFromDb.passwordHash);
    if (!isPasswordCorrect) {
        return NextResponse.json({ success: false, message: 'Incorrect current password.' }, { status: 403 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(payload.user.id, newPasswordHash);

    // Changing the password should invalidate other sessions.
    // We log the user out by clearing the cookie.
    cookies().delete(COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully! Please log in again.',
    });

  } catch (error) {
    console.error('Error in password change API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
