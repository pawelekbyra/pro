import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image || !image.startsWith('data:image/')) {
      return NextResponse.json({ success: false, message: 'Invalid image data' }, { status: 400 });
    }

    // In a real app, you would save this image to a storage service (like S3, Firebase Storage)
    // and return the new URL.
    // For this mock, we'll just log the (very long) data URL and return a new mock URL.
    console.log('Received avatar data URL (first 100 chars):', image.substring(0, 100));

    // Return a new mock URL to simulate a successful upload.
    // The timestamp ensures the URL is unique to break browser caching.
    const newAvatarUrl = `https://i.pravatar.cc/150?u=new-avatar-${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        url: newAvatarUrl,
      },
    });

  } catch (error) {
    console.error('Error in avatar upload API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
