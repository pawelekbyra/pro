import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { Slide } from '@/lib/types';
import { mockGrid as mockDataGrid } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (process.env.MOCK_API === 'true') {
    await new Promise(resolve => setTimeout(resolve, 500));
    return NextResponse.json({ grid: mockDataGrid });
  }

  try {
    const { searchParams } = new URL(request.url);
    const x = parseInt(searchParams.get('x') || '0', 10);
    const y = parseInt(searchParams.get('y') || '0', 10);
    const width = parseInt(searchParams.get('width') || '3', 10);
    const height = parseInt(searchParams.get('height') || '3', 10);

    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
      return NextResponse.json({ error: 'Invalid viewport parameters' }, { status: 400 });
    }

    const payload = await verifySession();
    const userId = payload?.user?.id;

    const slides = await db.getSlidesInView({ x, y, width, height, currentUserId: userId });
    const grid: { [key: string]: any } = {};
    slides.forEach(slide => {
      const key = `${slide.x},${slide.y}`;
      grid[key] = slide;
    });

    return NextResponse.json({ grid });

  } catch (error) {
    console.error('Error fetching slides:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}