import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'session';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
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

    // Invalidate all old sessions by incrementing the session version
    await db.incrementSessionVersion(payload.user.id);

    // We also log the current session out by clearing the cookie.
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
