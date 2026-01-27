import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/superadmin/messages - Obtener mensajes con un admin específico
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json({ error: 'adminId requerido' }, { status: 400 })
    }

    const messages = await prisma.adminMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: adminId },
          { senderId: adminId, receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { name: true },
        },
      },
    })

    // Marcar como leídos los mensajes recibidos
    await prisma.adminMessage.updateMany({
      where: {
        senderId: adminId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 })
  }
}

// POST /api/superadmin/messages - Enviar mensaje a un admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { content, imageUrl, receiverId, messageType } = body

    if (!content || !receiverId) {
      return NextResponse.json(
        { error: 'Contenido y destinatario son requeridos' },
        { status: 400 }
      )
    }

    const message = await prisma.adminMessage.create({
      data: {
        content,
        imageUrl,
        messageType: messageType || 'GENERAL',
        senderId: session.user.id,
        receiverId,
      },
      include: {
        sender: {
          select: { name: true },
        },
      },
    })

    // Crear notificación para el admin
    await prisma.notification.create({
      data: {
        title: messageType === 'BILLING' ? '💰 Nuevo mensaje de cobranza' :
               messageType === 'SUPPORT' ? '🛠️ Respuesta de soporte' :
               messageType === 'ANNOUNCEMENT' ? '📢 Nuevo aviso' :
               '💬 Nuevo mensaje',
        message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        type: messageType === 'BILLING' ? 'BILLING' : 'INFO',
        link: '/admin/messages',
        userId: receiverId,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
