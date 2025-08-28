import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

export async function GET(req: NextRequest) {
    const sessionCookie = cookies().get(COOKIE_NAME);

    if (!sessionCookie) {
        // It's not an error, just means the user is not logged in.
        return NextResponse.json({ success: false, user: null, message: 'No session found' });
    }

    try {
        const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);

        if (!payload || !payload.user) {
            // The token is valid, but the payload is malformed.
            return NextResponse.json({ success: false, user: null, message: 'Invalid token payload' });
        }

        return NextResponse.json({ success: true, user: payload.user });

    } catch (error) {
        // This can happen if the token is expired or invalid.
        console.log('JWT verification error:', error);
        // Again, return a successful response from the server, but indicate the auth failed.
        return NextResponse.json({ success: false, user: null, message: 'Session expired or invalid' });
    }
}
