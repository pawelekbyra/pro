import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
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

async function getSlidesData() {
  const jsonDirectory = path.join(process.cwd(), 'data.json');
  const fileContents = await fs.readFile(jsonDirectory, 'utf8');
  return JSON.parse(fileContents);
}

interface UserProfile {
  email: string;
  [key: string]: any; // Allow other properties
}

export async function POST(request: NextRequest) {
  const payload = await verifySession(request);
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required to like a post.' }, { status: 401 });
  }
  const user = payload.user as UserProfile;

  try {
    const { likeId } = await request.json();

    if (!likeId) {
      return NextResponse.json({ success: false, message: 'likeId is required' }, { status: 400 });
    }

    const allData = await getSlidesData();
    const slide = allData.slides.find((s: any) => s.likeId === likeId);

    if (!slide) {
      return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }

    // This is a mock, so we just toggle the state. In a real app, this would be a database transaction
    // tied to the user's ID from the JWT payload.
    const newIsLiked = !slide.isLiked;
    const newLikesCount = newIsLiked ? slide.initialLikes + 1 : slide.initialLikes - 1;

    console.log(`User ${user.email} toggled like for post ${likeId}. New status: ${newIsLiked}`);

    return NextResponse.json({
      success: true,
      isLiked: newIsLiked,
      likeCount: newLikesCount,
    });

  } catch (error) {
    console.error('Error in like API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
