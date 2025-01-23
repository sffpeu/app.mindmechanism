import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXTAUTH_URL) {
  console.error('NEXTAUTH_URL is not set');
}

if (!process.env.NEXTAUTH_SECRET) {
  console.error('NEXTAUTH_SECRET is not set');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Supabase environment variables are not set');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Please enter both email and password');
          }

          // Sign in with Supabase
          const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error('Supabase auth error:', error.message);
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

          return {
            id: user.id,
            email: user.email || '',
            name: profile?.name || user.email?.split('@')[0] || '',
            image: profile?.image || null,
          };
        } catch (error: any) {
          console.error('Auth error:', error);
          throw error;
        }
      }
    })
  ],
  pages: {
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST }; 