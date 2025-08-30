import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  const userId = payload.user.id;

  try {
    const notifications = await db.getNotifications(userId);
    const unreadCount = await db.getUnreadNotificationCount(userId);

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
