import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const x = parseInt(searchParams.get('x') || '0', 10);
  const y = parseInt(searchParams.get('y') || '0', 10);
  const width = parseInt(searchParams.get('width') || '3', 10);
  const height = parseInt(searchParams.get('height') || '3', 10);

  const session = await verifySession();
  const currentUserId = session?.user?.id;

  if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  try {
    const slides = await db.getSlidesInView({ x, y, width, height, currentUserId });

    const grid: { [key: string]: any } = {};
    slides.forEach(slide => {
      const key = `${slide.x},${slide.y}`;
      grid[key] = slide;
    });

    return NextResponse.json({ grid });
  } catch (error) {
    console.error('Error fetching slides:', error);
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}