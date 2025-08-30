import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = await verifySession();

  if (!payload || !payload.user) {
    return NextResponse.json({ isLoggedIn: false, user: null });
  }

  // Optionally, you could return the full, fresh user object from the DB
  // instead of the one from the token, in case details have changed.
  const freshUser = await db.findUserById(payload.user.id);
  if (!freshUser) {
    return NextResponse.json({ isLoggedIn: false, user: null });
  }
  const { passwordHash, ...userPayload } = freshUser;

  return NextResponse.json({ isLoggedIn: true, user: userPayload });
}
