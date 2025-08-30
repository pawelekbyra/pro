import { NextResponse, NextRequest } from 'next/server';
import { mockGrid } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // For now, we will only use mock data for the new slides endpoint.
  // In a real application, this would fetch data from a database.

  // We add a short delay to simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  // The new endpoint returns the grid directly.
  // The client will be responsible for handling the grid structure.
  return NextResponse.json({ grid: mockGrid });
}
