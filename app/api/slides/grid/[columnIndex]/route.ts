import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PAGE_SIZE = 10;

export async function GET(
  request: Request,
  { params }: { params: { columnIndex: string } }
) {
  try {
    const columnIndex = parseInt(params.columnIndex, 10);
    if (isNaN(columnIndex)) {
      return NextResponse.json({ error: 'Invalid column index' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);

    if (!db.getSlidesInColumn) {
        throw new Error('getSlidesInColumn is not implemented in the current DB provider.');
    }

    const slides = await db.getSlidesInColumn(columnIndex, {
      offset: cursor,
      limit: PAGE_SIZE,
    });

    const nextCursor = slides.length === PAGE_SIZE ? cursor + PAGE_SIZE : null;

    return NextResponse.json({
      slides,
      nextCursor,
    });

  } catch (error) {
    console.error(`Failed to fetch slides for column ${params.columnIndex}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
