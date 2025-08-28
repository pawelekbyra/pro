import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { confirm_text } = await request.json();

    if (confirm_text !== 'USUWAM KONTO') {
      return NextResponse.json({ success: false, message: 'Confirmation text is incorrect.' }, { status: 400 });
    }

    // In a real app, you would perform the actual account deletion here.
    // For this mock, we just simulate success.
    console.log('Mock account deletion successful.');

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. Logging out...',
    });

  } catch (error) {
    console.error('Error in account delete API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
