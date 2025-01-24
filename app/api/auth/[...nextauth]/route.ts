import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required');
          }

          console.log('Attempting to sign in with email:', credentials.email);

          const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error('Auth error:', error);
            throw new Error(error.message);
          }

          if (!user) {
            console.error('No user returned from auth');
            throw new Error('Invalid credentials');
          }

          console.log('User data:', user);

          // Get user profile first
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Profile error:', profileError);
            throw new Error('Error fetching user profile');
          }

          if (!profile) {
            console.error('No profile found for user');
            throw new Error('User profile not found');
          }

          // Check email verification status directly from user object
          if (!user.email_confirmed_at) {
            console.error('Email not confirmed for user:', user.email);
            throw new Error('Please verify your email before signing in');
          }

          console.log('Login successful for user:', user.email);

          return {
            id: user.id,
            email: user.email,
            name: profile.name,
          };
        } catch (error: any) {
          console.error('Authorization error:', error);
          throw new Error(error.message);
        }
      },
    }),
  ],
  debug: true,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('Sign in callback:', { user, account, profile });
      
      if (account?.provider === 'google') {
        try {
          // Create or update user profile in Supabase
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching profile:', fetchError);
            return false;
          }

          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              name: user.name,
              email: user.email,
              updated_at: new Date().toISOString(),
            });

          if (upsertError) {
            console.error('Error upserting profile:', upsertError);
            return false;
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback:', { token, user, account });
      if (user) {
        token.id = user.id;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token });
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export { handler as GET, handler as POST }; 