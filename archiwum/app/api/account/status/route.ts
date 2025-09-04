import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    const payload = await verifySession();

    if (!payload || !payload.user) {
        return NextResponse.json({ isLoggedIn: false, user: null });
    }

    // --- MOCK API LOGIC ---
    if (process.env.MOCK_API === 'true') {
        // If in mock mode and there's a valid session, we can assume it's the mock admin.
        // In a more complex mock setup, we might check the user ID from the payload.
        if (payload.user.id === 'user_mock_admin') {
             return NextResponse.json({ isLoggedIn: true, user: payload.user });
        }
    }
    // --- END MOCK API LOGIC ---

    const freshUser = await db.findUserById(payload.user.id);
    if (!freshUser) {
        // This can happen if the user was deleted but the cookie remains.
        return NextResponse.json({ isLoggedIn: false, user: null });
    }
    const { password, ...userPayload } = freshUser;

    return NextResponse.json({ isLoggedIn: true, user: userPayload });
}
