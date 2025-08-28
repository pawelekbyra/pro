import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function GET() {
  try {
    const payload = await verifySession();
    const userId = payload?.user?.id;

    const slidesWithDynamicData = await db.getSlides(userId || undefined);

    // The db layer now returns the full structure, so we just need the slides part
    return NextResponse.json({ slides: slidesWithDynamicData });

  } catch (error) {
    console.error('Error reading slides data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
