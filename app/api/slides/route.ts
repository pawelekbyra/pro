import { NextRequest, NextResponse } from 'next/server';
import { db, User } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

interface UserPayload {
    user: User;
    iat: number;
    exp: number;
}

async function getUserIdFromSession() {
    const sessionCookie = cookies().get(COOKIE_NAME);
    if (!sessionCookie) return null;

    try {
        const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
        return (payload as UserPayload).user?.id || null;
    } catch (error) {
        return null;
    }
}

export async function GET() {
  try {
    const userId = await getUserIdFromSession();
    const slidesWithDynamicData = await db.getSlides(userId || undefined);

    // The db layer now returns the full structure, so we just need the slides part
    return NextResponse.json({ slides: slidesWithDynamicData });

  } catch (error) {
    console.error('Error reading slides data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
