import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : 5;

    const session = await verifySession();
    const currentUserId = session?.user?.id;

    if (!db.getSlides) {
        return NextResponse.json({ error: 'db.getSlides is not a function' }, { status: 500 });
    }

    const slides = await db.getSlides({ limit, cursor, currentUserId });

    let nextCursor: string | null = null;
    let slidesToSend = slides;

    if (slides.length > limit) {
      // If we got more slides than the limit, there's a next page.
      const lastSlide = slides[limit - 1]; // The last slide of the *current* page
      nextCursor = lastSlide.createdAt.toString();
      slidesToSend = slides.slice(0, limit); // Send only the requested number of slides
    }

    return NextResponse.json({
      slides: slidesToSend,
      nextCursor,
    });
  } catch (error) {
    console.error('Failed to fetch slides:', error);
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
  }
}