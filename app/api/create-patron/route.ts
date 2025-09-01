// app/api/create-patron/route.ts
// app/api/create-patron/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendPasswordResetLinkEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        // Sprawdzenie, czy użytkownik już istnieje
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return NextResponse.json({ success: false, message: 'Użytkownik z tym adresem email już istnieje.' }, { status: 409 });
        }

        // Create user with a temporary, un-usable password
        const tempPassword = randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await db.createUser({
            email,
            password: hashedPassword,
            username: email.split('@')[0],
            displayName: `Patron ${email.split('@')[0]}`,
            role: 'user',
        });

        // Generate password reset token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        await db.createPasswordResetToken(newUser.id, token, expiresAt);

        // Send password reset link
        const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
        await sendPasswordResetLinkEmail(email, resetLink);

        return NextResponse.json({
            success: true,
            message: 'Konto zostało utworzone. Sprawdź e-mail, aby ustawić hasło.',
        }, { status: 201 });

    } catch (error) {
        console.error('Błąd podczas tworzenia konta patrona:', error);
        return NextResponse.json({ success: false, message: 'Wystąpił wewnętrzny błąd serwera.' }, { status: 500 });
    }
}
