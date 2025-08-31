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
        type: 'html',
        data: {
          htmlContent: `<div style="background-color:${generateRandomColor()};color:white;display:flex;justify-content:center;align-items:center;width:100%;height:100%"><h1>Slide ${x},${y}</h1></div>`
        },
        userId: 'mock-user-id',
        username: 'mock-user',
        avatar: 'https://i.pravatar.cc/150',
        access: 'public',
        createdAt: Date.now(),
        initialLikes: 0,
        isLiked: false,
        initialComments: 0,
      };
    }
  }

  return NextResponse.json({ grid });
}