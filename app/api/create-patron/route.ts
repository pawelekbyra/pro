// app/api/create-patron/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        // Sprawdzenie, czy użytkownik już istnieje
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return NextResponse.json({ success: false, message: 'Użytkownik z tym adresem email już istnieje.' }, { status: 409 });
        }

        // Generowanie losowego hasła
        const password = randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tworzenie użytkownika w bazie danych
        const newUser = await db.createUser({
            email,
            password: hashedPassword,
            username: email.split('@')[0],
            displayName: `Patron ${email.split('@')[0]}`,
            role: 'user',
        });

        // Wysłanie e-maila z loginem i hasłem (koncepcyjnie)
        // Usunięto logowanie hasła w celu zwiększenia bezpieczeństwa

        return NextResponse.json({
            success: true,
            message: 'Konto zostało utworzone. Sprawdź e-mail, aby uzyskać dane logowania.',
        }, { status: 201 });

    } catch (error) {
        console.error('Błąd podczas tworzenia konta patrona:', error);
        return NextResponse.json({ success: false, message: 'Wystąpił wewnętrzny błąd serwera.' }, { status: 500 });
    }
}
