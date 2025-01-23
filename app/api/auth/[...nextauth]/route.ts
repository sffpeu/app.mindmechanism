import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import type { JWT } from 'next-auth/jwt';

// For development, we'll use an in-memory store
const users = new Map();

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password');
        }

        // For development, we'll use the in-memory store
        const user = users.get(credentials.email);
        
        if (!user) {
          // During sign-in, if user doesn't exist, create one (for development only)
          const newUser = {
            id: Date.now().toString(),
            email: credentials.email,
            password: credentials.password, // In development, we'll store plain password
            name: credentials.email.split('@')[0],
          };
          users.set(credentials.email, newUser);
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          };
        }

        // In development, we'll do a simple password comparison
        const isValid = user.password === credentials.password;

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
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
});

export { handler as GET, handler as POST }; 