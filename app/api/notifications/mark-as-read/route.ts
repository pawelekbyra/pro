import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ success: false, message: 'notificationId is required' }, { status: 400 });
    }

    // This will be implemented in the mock db layer later.
    // For now, we assume it exists and works.
    // await db.markNotificationAsRead(notificationId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
