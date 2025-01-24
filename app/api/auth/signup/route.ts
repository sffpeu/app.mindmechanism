import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Regular client for auth operations
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get the site URL from environment, fallback to localhost for development
const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Attempting to sign up user with email:', email);

    // Sign up the user with Supabase using the auth client
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: `${siteUrl}/auth/signin`,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { message: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error('No user data returned from auth signup');
      return NextResponse.json(
        { message: 'User creation failed' },
        { status: 400 }
      );
    }

    console.log('User created successfully with ID:', authData.user.id);

    // Return success message with confirmation instructions
    return NextResponse.json(
      { 
        success: true,
        message: 'Account created successfully! Please check your email to confirm your account.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred during signup' },
      { status: 500 }
    );
  }
} 