import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

interface UserProfile {
  [key: string]: any; // Allow any properties
}

async function verifySession(req: NextRequest) {
    const sessionCookie = cookies().get(COOKIE_NAME);
    if (!sessionCookie) return null;

    try {
        const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

// GET handler to retrieve the current user's profile from their session
export async function GET(req: NextRequest) {
    const payload = await verifySession(req);

    if (!payload || !payload.user) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: payload.user });
}


// PUT handler to update the user's profile
export async function PUT(req: NextRequest) {
    const payload = await verifySession(req);

    if (!payload || !payload.user) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    const user = payload.user as UserProfile;

    try {
        const body = await req.json();
        const { firstName, lastName, email } = body;

        if (!firstName || !lastName || !email) {
            return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
        }

        // In a real database, you would update the user's record here.
        // For this mock, we'll just merge the new data and return it.
        const updatedUser = {
            ...user,
            firstName,
            lastName,
            email,
            displayName: `${firstName} ${lastName}`,
        };

        return NextResponse.json({ success: true, data: updatedUser });

    } catch (error) {
        console.error('Error in profile update API:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
