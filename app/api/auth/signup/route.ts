import { NextResponse } from 'next/server';

// Access the same in-memory store
declare global {
  var users: Map<string, any>;
}

if (!global.users) {
  global.users = new Map();
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Please fill in all fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (global.users.has(email)) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password, // In development, we'll store plain password
    };

    // Store user
    global.users.set(email, user);

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in signup:', error);
    return NextResponse.json(
      { message: 'Error creating user' },
      { status: 500 }
    );
  }
} 