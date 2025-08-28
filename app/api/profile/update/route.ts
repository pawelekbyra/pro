import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { db, User } from '@/lib/db';
import { UserPayload } from '@/lib/types';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

async function verifySession(req: NextRequest): Promise<UserPayload | null> {
    const sessionCookie = cookies().get(COOKIE_NAME);
    if (!sessionCookie) return null;

    try {
        const { payload } = await jwtVerify<UserPayload>(sessionCookie.value, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

// This GET handler is no longer needed here, as the /api/account/status route handles this.
// However, leaving it in won't cause harm. For cleanup, it could be removed.
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
    const currentUser = payload.user;

    try {
        const body = await req.json();
        const { firstName, lastName, email } = body;

        if (!firstName || !lastName || !email) {
            return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
        }

        // Validate if the new email is already in use by another user
        if (email.toLowerCase() !== currentUser.email.toLowerCase()) {
            const emailInUse = await db.isEmailInUse(email, currentUser.id);
            if (emailInUse) {
                return NextResponse.json({ success: false, message: 'This email is already in use.' }, { status: 409 });
            }
        }

        const updates: Partial<User> = {
            firstName,
            lastName,
            email,
            displayName: `${firstName} ${lastName}`,
        };

        const updatedUser = await db.updateUser(currentUser.id, updates);

        if (!updatedUser) {
             return NextResponse.json({ success: false, message: 'User not found or failed to update.' }, { status: 404 });
        }

        // Re-issue the JWT with the updated user details
        const { passwordHash, ...userPayload } = updatedUser;
        const token = await new SignJWT({ user: userPayload })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        cookies().set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
        });


        return NextResponse.json({ success: true, data: userPayload });

    } catch (error) {
        console.error('Error in profile update API:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
