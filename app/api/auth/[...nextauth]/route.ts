import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getSupabase } from '@/lib/supabase';
import type { User } from 'next-auth';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Please enter both email and password');
          }

          const supabase = getSupabase();
          if (!supabase) {
            console.error('Supabase client initialization failed');
            throw new Error('Authentication service unavailable');
          }

          // Sign in with Supabase
          const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error('Supabase auth error:', error);
            throw new Error(error.message);
          }

          if (!user) {
            throw new Error('User not found');
          }

          // Get additional user data from Supabase if needed
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          // Ensure the returned object matches the User type
          return {
            id: user.id,
            email: user.email || '',
            name: (profile?.name as string) || user.email?.split('@')[0] || '',
            image: profile?.image as string || null,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST }; 