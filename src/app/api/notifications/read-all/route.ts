import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/notifications/read-all - Marcar todas las notificaciones como leídas
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: { 
        userId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all as read:', error)
    return NextResponse.json({ error: 'Error al marcar notificaciones' }, { status: 500 })
  }
}
