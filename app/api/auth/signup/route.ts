import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign up the user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { message: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: 'User creation failed' },
        { status: 400 }
      );
    }

    // Insert the user's profile into the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
        },
      ]);

    if (profileError) {
      // If profile creation fails, we should ideally clean up the auth user
      // but Supabase will handle this with cascading deletes
      return NextResponse.json(
        { message: 'Profile creation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'User created successfully' },
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