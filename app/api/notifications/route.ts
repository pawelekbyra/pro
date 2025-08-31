import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const notifications = await sql`
      SELECT * FROM notifications
      WHERE "userId" = ${payload.user.id}
      ORDER BY "createdAt" DESC;
    `;
    const unreadCountResult = await sql`
      SELECT COUNT(*) FROM notifications
      WHERE "userId" = ${payload.user.id} AND read = false;
    `;
    const unreadCount = unreadCountResult[0].count;
    return NextResponse.json({ success: true, notifications, unreadCount });
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

    const subscription = await request.json();

    try {
        await sql`
            INSERT INTO push_subscriptions ("userId", subscription)
            VALUES (${payload.user.id}, ${JSON.stringify(subscription)})
            ON CONFLICT ("userId") DO UPDATE
            SET subscription = ${JSON.stringify(subscription)};
        `;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
