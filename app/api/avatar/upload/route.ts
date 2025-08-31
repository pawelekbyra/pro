import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import path from 'path';
import { writeFile, stat, mkdir } from 'fs/promises';
import { verifySession } from '@/lib/auth';

async function ensureDir(dirPath: string) {
    try {
        await stat(dirPath);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await mkdir(dirPath, { recursive: true });
        } else {
            throw error;
        }
    }
}

export async function POST(request: NextRequest) {
    const payload = await verifySession();
    if (!payload || !payload.user) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    const currentUser = payload.user;

    try {
        const data = await request.formData();
        const file: File | null = data.get('avatar') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define the directory and ensure it exists
        const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
        await ensureDir(avatarsDir);

        // Create a unique filename
        const extension = path.extname(file.name) || '.png'; // Default to png
        const filename = `${currentUser.id}-${Date.now()}${extension}`;
        const avatarPath = path.join(avatarsDir, filename);

        await writeFile(avatarPath, buffer);
        console.log(`Avatar for user ${currentUser.id} saved to ${avatarPath}`);

        const avatarUrl = `/avatars/${filename}`;

        // Update user record in the database
        const updatedUser = await db.updateUser(currentUser.id, { avatar: avatarUrl });
        if (!updatedUser) {
            return NextResponse.json({ success: false, message: 'Failed to update user record.' }, { status: 500 });
        }

        // Re-issue the JWT with the updated user details
        const { password, ...userPayload } = updatedUser;
        const token = await new SignJWT({ user: userPayload })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-enough-for-hs256'));

        cookies().set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
        });

        return NextResponse.json({ success: true, url: avatarUrl });

    } catch (error) {
        console.error('Avatar upload error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
