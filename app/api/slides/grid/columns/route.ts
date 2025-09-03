import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // The db object is typed to have optional methods, so we check for its existence
    // to ensure type safety, especially if the postgres implementation is not updated.
    if (!db.getAllColumnCoords) {
      throw new Error('getAllColumnCoords is not implemented in the current DB provider.');
    }

    const columns = await db.getAllColumnCoords();
    const columnIndices = columns.map(c => c.x);

    return NextResponse.json(columnIndices);
  } catch (error) {
    console.error('Failed to fetch column coordinates:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
