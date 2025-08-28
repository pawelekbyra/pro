import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// This is a mock API. In a real app, you'd use a database.
// We read the data on every request to simulate fetching from a DB,
// but we don't write it back, so the state is ephemeral.
async function getSlidesData() {
  const jsonDirectory = path.join(process.cwd(), 'data.json');
  const fileContents = await fs.readFile(jsonDirectory, 'utf8');
  return JSON.parse(fileContents);
}

export async function POST(request: Request) {
  try {
    const { likeId } = await request.json();

    if (!likeId) {
      return NextResponse.json({ success: false, message: 'likeId is required' }, { status: 400 });
    }

    const allData = await getSlidesData();
    const slide = allData.slides.find((s: any) => s.likeId === likeId);

    if (!slide) {
      return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }

    // Toggle the like state and update the count
    slide.isLiked = !slide.isLiked;
    slide.initialLikes = slide.isLiked ? slide.initialLikes + 1 : slide.initialLikes - 1;

    // In this mock, we don't save the changes back to data.json.
    // The state is intentionally ephemeral for this prototype.

    return NextResponse.json({
      success: true,
      status: slide.isLiked ? 'liked' : 'unliked',
      count: slide.initialLikes,
    });

  } catch (error) {
    console.error('Error in like API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
