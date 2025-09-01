import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = 'session';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'New password must be at least 8 characters long.' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'New passwords do not match.' }, { status: 400 });
    }

    const userFromDb = await db.findUserById(payload.user.id);
    if (!userFromDb) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    if (!userFromDb.password) {
        return NextResponse.json({ success: false, message: 'Incorrect current password.' }, { status: 403 });
    }
    const isPasswordCorrect = await bcrypt.compare(currentPassword, userFromDb.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ success: false, message: 'Incorrect current password.' }, { status: 403 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and session version in one call
    const updatedUser = await db.updateUser(payload.user.id, {
        password: newPasswordHash,
        sessionVersion: (userFromDb.sessionVersion || 1) + 1,
    });
    if (!updatedUser) {
        // This should not happen, but handle it just in case
        cookies().delete(COOKIE_NAME);
        return NextResponse.json({ success: false, message: 'Could not re-issue session. Please log in.' }, { status: 500 });
    }

    // Don't include password hash in the new token payload
    const { password: _, ...userPayload } = updatedUser;

    // Create a new session token with the updated session version
    const newToken = await new SignJWT({ user: userPayload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Set the new session cookie, keeping the user logged in
    cookies().set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully!',
    });

  } catch (error) {
    console.error('Error in password change API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
