import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
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
          storeId: storeIds[0] || null, // Primera tienda por defecto
          storeIds: storeIds, // Todas las tiendas
          zoneId: user.zoneId || null, // Zona del admin
          zoneName: user.zone?.name || null, // Nombre de la zona
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
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
        session.user.storeId = token.storeId as string | null
        session.user.storeIds = (token.storeIds as string[]) || []
        session.user.zoneId = token.zoneId as string | null
        session.user.zoneName = token.zoneName as string | null
      }
      return session
    },
  },
}
