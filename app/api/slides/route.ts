import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db'; // Using the mock DB directly

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const slides = await db.getAllSlides();
    const grid: { [key: string]: any } = {};
    slides.forEach(slide => {
      const key = `${slide.x},${slide.y}`;
      grid[key] = slide;
    });

    return NextResponse.json({ grid });
  } catch (error) {
    console.error('Error fetching slides from mock DB:', error);
    return NextResponse.json({ error: 'An unknown error occurred in mock API' }, { status: 500 });
  }
}