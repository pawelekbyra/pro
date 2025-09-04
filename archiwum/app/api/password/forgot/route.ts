import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendPasswordResetLinkEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const user = await db.findUserByEmail(email);
    if (!user) {
      // Don't reveal that the user doesn't exist.
      // Still return a success message to prevent user enumeration attacks.
      return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await db.createPasswordResetToken(user.id, token, expiresAt);

    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    await sendPasswordResetLinkEmail(email, resetLink);

    return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('Error in forgot password route:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
