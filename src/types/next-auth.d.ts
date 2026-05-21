import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: string
    phone?: string | null
    storeId: string | null
    storeIds: string[]
    zoneId: string | null
    zoneName: string | null
  }

  interface Session {
    user: User & {
      id: string
      role: string
      phone?: string | null
      storeId: string | null
      storeIds: string[]
      zoneId: string | null
      zoneName: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    phone?: string | null
    storeId: string | null
    storeIds: string[]
    zoneId: string | null
    zoneName: string | null
  }
}
