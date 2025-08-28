import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // In a real app, you would get the post ID from the request body
  // and update the like status in a database.

  // For this mock, we'll just simulate a successful toggle.
  const isCurrentlyLiked = Math.random() > 0.5; // Simulate current state
  const currentLikes = Math.floor(Math.random() * 1000);

  const newLikedState = !isCurrentlyLiked;
  const newLikeCount = currentLikes + (newLikedState ? 1 : -1);

  return NextResponse.json({
    success: true,
    isLiked: newLikedState,
    likeCount: newLikeCount,
  });
}
