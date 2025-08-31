import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { kv } from '@/lib/kv';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  const userId = payload.user.id;

  try {
    const { notificationId } = await request.json();

    if (!notificationId || typeof notificationId !== 'string') {
      return NextResponse.json({ success: false, message: 'notificationId is required and must be a string' }, { status: 400 });
    }

    // Security check: Ensure the notification belongs to the user trying to mark it as read.
    const notification = await kv!.get(`notification:${notificationId}`);
    if (!notification || (notification as any).userId !== userId) {
        return NextResponse.json({ success: false, message: 'Notification not found or access denied.' }, { status: 404 });
    }

    await db.markNotificationAsRead(notificationId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
