import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, User } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = 'session';

export interface AuthPayload {
    user: {
        id: string;
        sessionVersion: number;
        [key: string]: any;
    };
    iat: number;
    exp: number;
}

export async function verifySession(): Promise<AuthPayload | null> {
    const sessionCookie = cookies().get(COOKIE_NAME);
    if (!sessionCookie) {
        return null;
    }

    try {
        // 1. Verify the token's signature and structure
        const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
        const authPayload = payload as unknown as AuthPayload;

        if (!authPayload.user?.id || typeof authPayload.user?.sessionVersion !== 'number') {
            console.log("Token payload is malformed.");
            return null;
        }

        // 2. Fetch the user's current state from the database
        const userFromDb = await db.findUserById(authPayload.user.id);
        if (!userFromDb) {
            console.log(`User ${authPayload.user.id} not found in DB.`);
            return null;
        }

        // 3. Compare session versions
        if (userFromDb.sessionVersion !== authPayload.user.sessionVersion) {
            console.log(`Token session version mismatch for user ${userFromDb.id}. DB: ${userFromDb.sessionVersion}, Token: ${authPayload.user.sessionVersion}`);
            return null; // Stale token, reject it.
        }

        // 4. If everything is valid, return the payload
        return authPayload;

    } catch (error) {
        console.log("Session verification failed:", error);
        return null;
    }
}
