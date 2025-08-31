import { NextResponse } from 'next/server';
import { Grid } from '@/lib/types';

export const dynamic = 'force-dynamic';

function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export async function GET() {
  const grid: Grid = {};
  const size = 9;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const key = `${x},${y}`;
      grid[key] = {
        id: `slide-${x}-${y}`,
        x,
        y,
        content: {
          type: 'text',
          title: `Slide ${x},${y}`,
          text: `Coordinates: ${x}, ${y}`,
          backgroundColor: generateRandomColor(),
        },
        video_url: '', // Not needed for this test
        user_id: '',
        user_name: '',
        user_avatar_url: '',
        likes: 0,
        is_liked: false,
        initialComments: [],
        comments_count: 0,
        shares: 0,
        created_at: new Date().toISOString(),
      };
    }
  }

  return NextResponse.json({ grid });
}