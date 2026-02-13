import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              restaurant: true,
              branch: true
            }
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            restaurantId: user.restaurantId,
            branchId: user.branchId,
            restaurant: user.restaurant,
            branch: user.branch,
            photo: user.photo
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.restaurantId = user.restaurantId;
        token.branchId = user.branchId;
        token.restaurant = user.restaurant;
        token.branch = user.branch;
        token.photo = user.photo;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.restaurantId = token.restaurantId;
        session.user.branchId = token.branchId;
        session.user.restaurant = token.restaurant;
        session.user.branch = token.branch;
        session.user.photo = token.photo;
      }
      return session;
    }
  },
  
  pages: {
    signIn: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  
  secret: process.env.NEXTAUTH_SECRET,
});
