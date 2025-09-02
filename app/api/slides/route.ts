import { NextResponse } from 'next/server';
import { mockGrid } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Return the mock grid directly
  return NextResponse.json({ grid: mockGrid }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}