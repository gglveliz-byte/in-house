import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare, hash } from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: 'CUSTOMER',
          storeId: null,
          storeIds: [],
          zoneId: null,
          zoneName: null,
        } as unknown as import('next-auth').User
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { 
            stores: true, // Ahora es plural
            zone: true,   // Zona del admin
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        // Guardar IDs de todas las tiendas
        const storeIds = user.stores.map((s) => s.id)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          storeId: storeIds[0] || null, // Primera tienda por defecto
          storeIds: storeIds, // Todas las tiendas
          zoneId: user.zoneId || null, // Zona del admin
          zoneName: user.zone?.name || null, // Nombre de la zona
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false
        
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })
        
        if (!existingUser) {
          const randomPassword = await hash(Math.random().toString(36) + Date.now().toString(), 10)
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || 'Cliente Google',
              password: randomPassword,
              role: 'CUSTOMER',
            },
          })
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'google') {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.phone = dbUser.phone
          } else {
            token.id = user.id
            token.role = user.role
            token.phone = null
          }
        } else {
          token.id = user.id
          token.role = user.role
          token.phone = (user as import('next-auth').User).phone || null
        }
        token.storeId = user.storeId
        token.storeIds = user.storeIds || []
        token.zoneId = user.zoneId || null
        token.zoneName = user.zoneName || null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.phone = token.phone as string | null
        session.user.storeId = token.storeId as string | null
        session.user.storeIds = (token.storeIds as string[]) || []
        session.user.zoneId = token.zoneId as string | null
        session.user.zoneName = token.zoneName as string | null
      }
      return session
    },
  },
}
