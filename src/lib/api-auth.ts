import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireAuth(roles?: string[]) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }), session: null }
  }

  if (roles && !roles.includes(session.user.role)) {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }), session: null }
  }

  return { error: null, session }
}

export async function optionalAuth() {
  const session = await getServerSession(authOptions)
  return { session }
}
