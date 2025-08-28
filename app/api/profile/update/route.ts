import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { db, User } from '@/lib/db';
import { verifySession } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256');
const COOKIE_NAME = 'session';

// This GET handler is redundant and can be removed.
export async function GET(req: NextRequest) {
    const payload = await verifySession();
    if (!payload || !payload.user) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ success: true, data: payload.user });
}


// PUT handler to update the user's profile
export async function PUT(req: NextRequest) {
    const payload = await verifySession();

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

        const currentEmail = (await db.findUserById(currentUser.id))?.email;
        if (email.toLowerCase() !== currentEmail?.toLowerCase()) {
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
            maxAge: 60 * 60 * 24,
        });


        return NextResponse.json({ success: true, data: userPayload });

    } catch (error) {
        console.error('Error in profile update API:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
