import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { mockNotifications } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    // Even for mock mode, let's keep the auth check
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const unreadCount = mockNotifications.filter(n => !n.read).length;
    return NextResponse.json({ success: true, notifications: mockNotifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
