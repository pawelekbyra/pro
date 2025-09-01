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
  if (!payload || !payload.user || payload.user.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const { userId, userType, targetPwa, targetBrowser, title, body, url } = await request.json();

  try {
    const options: { userId?: string, userType?: string, isPwaInstalled?: boolean } = {};
    let subscriptions = [];

    if (userId) {
        options.userId = userId;
        subscriptions = await db.getPushSubscriptions(options);
    } else if (userType) {
        options.userType = userType;
        subscriptions = await db.getPushSubscriptions(options);
    } else if (targetPwa || targetBrowser) {
        if (targetPwa && targetBrowser) {
            // Get all users, no isPwaInstalled filter
            subscriptions = await db.getPushSubscriptions({});
        } else if (targetPwa) {
            options.isPwaInstalled = true;
            subscriptions = await db.getPushSubscriptions(options);
        } else { // targetBrowser
            options.isPwaInstalled = false;
            subscriptions = await db.getPushSubscriptions(options);
        }
    } else {
        return NextResponse.json({ success: false, message: 'Target user, userType, or a PWA/browser group is required.' }, { status: 400 });
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
