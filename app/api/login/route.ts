import { NextResponse } from 'next/server';

export async function POST() {
  // In a real app, you would validate credentials here.
  // For this mock, we'll just simulate a successful login.

  const response = NextResponse.json({ success: true, message: 'Logged in successfully.' });

  // Set a mock cookie to simulate a session
  response.cookies.set('auth_token', 'mock_user_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  });

  return response;
}
