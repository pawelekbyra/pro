import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';
import webpush from 'web-push';

const sql = neon(process.env.DATABASE_URL!);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user || payload.user.user_type !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const { userId, userType, title, body, url } = await request.json();

  try {
    let subscriptions;
    if (userId) {
      subscriptions = await sql`
        SELECT subscription FROM push_subscriptions WHERE "userId" = ${userId};
      `;
    } else if (userType) {
      subscriptions = await sql`
        SELECT ps.subscription FROM push_subscriptions ps
        JOIN users u ON ps."userId" = u.id
        WHERE u.user_type = ${userType};
      `;
    } else {
      return NextResponse.json({ success: false, message: 'Target user or userType is required.' }, { status: 400 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: false, message: 'No subscriptions found for the target.' }, { status: 404 });
    }

    const notificationPayload = JSON.stringify({ title, body, url });

    const sendPromises = subscriptions.map(s =>
      webpush.sendNotification(s.subscription, notificationPayload)
    );

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, message: 'Notifications sent.' });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
