import { NextResponse } from 'next/server';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'message',
    preview: 'New message from Admin',
    time: '2 mins ago',
    full: 'Hi there! Just wanted to let you know that a new version of the app is available.',
    unread: true,
  },
  {
    id: 2,
    type: 'profile',
    preview: 'Your profile has been updated',
    time: '10 mins ago',
    full: 'Your profile changes have been saved successfully.',
    unread: true,
  },
  {
    id: 3,
    type: 'offer',
    preview: 'A special offer is waiting for you!',
    time: '1 hour ago',
    full: "Don't miss out! We have prepared a special summer promotion just for you.",
    unread: false,
  },
];

export async function GET() {
  return NextResponse.json({ notifications: MOCK_NOTIFICATIONS });
}
