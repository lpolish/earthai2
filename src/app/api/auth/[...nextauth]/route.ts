import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);
          
          // Dynamic import to avoid build-time database connection
          const { db, users } = await import('@/db');
          
          const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

          if (!user.length) {
            return null;
          }

          const foundUser = user[0];
          
          // Don't allow credential login for OAuth-only users (those without passwords)
          if (!foundUser.password) {
            return null;
          }
          
          const isValid = await bcrypt.compare(password, foundUser.password);

          if (!isValid) {
            return null;
          }

          return {
            id: foundUser.id.toString(),
            email: foundUser.email,
            name: foundUser.name,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        if (account?.provider === 'google') {
          // Enhanced Google OAuth user handling
          if (!user.email) {
            console.error('Google sign-in: No email provided');
            return false;
          }

          try {
            // Dynamic import to avoid build-time database connection
            const { db, users } = await import('@/db');
            
            // Check if user exists in database
            const existingUser = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

            if (!existingUser.length) {
              // Create new user for Google OAuth with better error handling
              try {
                const newUser = await db.insert(users).values({
                  email: user.email,
                  name: user.name || user.email.split('@')[0], // Fallback name
                  password: null, // Google users don't have passwords
                }).returning();

                user.id = newUser[0].id.toString();
                console.log('Created new Google user:', user.email);
              } catch (dbError) {
                console.error('Failed to create Google user:', dbError);
                // For development, allow auth to continue even if DB fails
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Development mode: Allowing auth without database');
                  user.id = user.email; // Use email as temp ID
                  return true;
                }
                return false;
              }
            } else {
              user.id = existingUser[0].id.toString();
              
              // Update user info if needed (name might have changed)
              if (existingUser[0].name !== user.name && user.name) {
                try {
                  await db.update(users)
                    .set({ name: user.name })
                    .where(eq(users.id, existingUser[0].id));
                } catch (updateError) {
                  console.error('Failed to update user name:', updateError);
                  // Don't fail the sign-in for this
                }
              }
            }
          } catch (dbError) {
            console.error('Database error during Google sign-in:', dbError);
            // For development, allow auth to continue even if DB fails
            if (process.env.NODE_ENV === 'development') {
              console.warn('Development mode: Allowing auth without database');
              user.id = user.email; // Use email as temp ID
              return true;
            }
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error('Sign-in callback error:', error);
        // For development, be more permissive
        if (process.env.NODE_ENV === 'development') {
          console.warn('Development mode: Allowing auth despite errors');
          return true;
        }
        return false;
      }
    },
    async jwt({ token, user, account, trigger }) {
      // Enhanced JWT callback with better error handling
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      
      // Handle token refresh/update with dynamic import
      if (trigger === 'update') {
        try {
          if (token.email) {
            const { db, users } = await import('@/db');
            const userData = await db.select().from(users).where(eq(users.email, token.email)).limit(1);
            if (userData.length > 0) {
              token.id = userData[0].id.toString();
              token.name = userData[0].name;
            }
          }
        } catch (error) {
          console.error('JWT update error:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Enhanced session callback
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Enhanced redirect handling
      // Allows relative callback URLs on same origin
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      // Log successful sign-ins for debugging
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
    },
    async signOut({ token }) {
      // Log sign-outs for debugging
      console.log(`User signed out: ${token?.email}`);
    },
    async createUser({ user }) {
      // Log new user creation
      console.log(`New user created: ${user.email}`);
    },
  },
  // Enhanced error handling
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata);
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };