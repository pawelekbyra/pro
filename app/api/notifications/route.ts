import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    // Return empty array if not logged in, as notifications are protected
    return NextResponse.json({ notifications: [] });
  }

  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'en';

  const notifications = await db.getNotifications(payload.user.id, lang);

  return NextResponse.json({ notifications });
}
