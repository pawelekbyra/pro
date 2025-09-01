import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Grid, Slide } from '@/lib/types';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const payload = await verifySession();
  const userId = payload?.user?.id;

  const searchParams = request.nextUrl.searchParams;
  const xStr = searchParams.get('x');
  const metaOnly = searchParams.get('meta_only') === 'true';

  let slides: Slide[];

  if (xStr !== null) {
    const x = parseInt(xStr, 10);
    if (isNaN(x)) {
      return NextResponse.json({ error: 'Invalid column number' }, { status: 400 });
    }
    // Fetch one column. Assuming a large number for height to get all slides in the column.
    slides = await db.getSlidesInView({ x, y: 0, width: 1, height: 1000, currentUserId: userId, metadataOnly: metaOnly });
  } else {
    // Fetch a reasonable default grid size if no column is specified.
    slides = await db.getSlidesInView({ x: 0, y: 0, width: 4, height: 10, currentUserId: userId, metadataOnly: metaOnly });
  }

  const grid: Grid = {};
  slides.forEach(slide => {
    grid[`${slide.x},${slide.y}`] = slide;
  });

  return NextResponse.json({ grid });
}