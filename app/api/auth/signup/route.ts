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

    console.log('Attempting to sign up user with email:', email);

    // Sign up the user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
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

    // Insert the user's profile into the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // If profile creation fails, we should ideally clean up the auth user
      // but Supabase will handle this with cascading deletes
      return NextResponse.json(
        { message: `Profile creation failed: ${profileError.message}` },
        { status: 400 }
      );
    }

    console.log('Profile created successfully:', profileData);

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