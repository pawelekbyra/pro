import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const notifications = await db.getNotifications(payload.user.id);
    const unreadCount = await db.getUnreadNotificationCount(payload.user.id);
    return NextResponse.json({ success: true, notifications, unreadCount }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    const payload = await verifySession();
    if (!payload || !payload.user) {
        return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }

    const { subscription, isPwaInstalled } = await request.json();

    try {
        await db.savePushSubscription(payload.user.id, subscription, isPwaInstalled);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
