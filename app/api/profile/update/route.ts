import { NextResponse } from 'next/server';

// Mock user data - in a real app, this would come from a database
let mockProfile = {
  firstName: 'Jules',
  lastName: 'Winnfield',
  email: 'jules@example.com',
  displayName: 'Jules Winnfield',
  avatar: 'https://i.pravatar.cc/100?u=jules',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email } = body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }

    // Simulate update
    mockProfile.firstName = firstName;
    mockProfile.lastName = lastName;
    mockProfile.email = email;
    mockProfile.displayName = `${firstName} ${lastName}`;

    console.log('Updated mock profile:', mockProfile);

    // Return the updated data
    return NextResponse.json({
      success: true,
      data: mockProfile,
    });

  } catch (error) {
    console.error('Error in profile update API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
    // Simple GET handler to retrieve the current mock profile
    return NextResponse.json({
        success: true,
        data: mockProfile,
    });
}
