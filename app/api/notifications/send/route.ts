import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import webpush from 'web-push';

if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
}


export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user || payload.user.user_type !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const { userId, userType, title, body, url } = await request.json();

  try {
    let subscriptions;
    if (userId || userType) {
        subscriptions = await db.getPushSubscriptions({ userId, userType });
    } else {
        return NextResponse.json({ success: false, message: 'Target user or userType is required.' }, { status: 400 });
    }


    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: false, message: 'No subscriptions found for the target.' }, { status: 404 });
    }

    const notificationPayload = JSON.stringify({ title, body, url });

    const sendPromises = subscriptions.map((s: any) =>
      webpush.sendNotification(s.subscription, notificationPayload)
    );

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, message: 'Notifications sent.' });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
