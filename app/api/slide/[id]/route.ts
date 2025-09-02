import { NextRequest, NextResponse } from 'next/server';
import { mockGrid } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 });
  }

  try {
    const slide = Object.values(mockGrid).find(s => s.id === id);

    if (!slide) {
      return NextResponse.json({ error: 'Slide not found in mock data' }, { status: 404 });
    }

    return NextResponse.json({ slide });
  } catch (error) {
    console.error(`Error fetching slide ${id} from mock data:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
