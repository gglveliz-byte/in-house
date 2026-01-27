import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/messages - Obtener mensajes con Super Admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el Super Admin de este Admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { superAdminId: true },
    })

    if (!admin?.superAdminId) {
      return NextResponse.json([]) // No tiene Super Admin asignado
    }

    const messages = await prisma.adminMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: admin.superAdminId },
          { senderId: admin.superAdminId, receiverId: session.user.id },
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
        senderId: admin.superAdminId,
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

// POST /api/admin/messages - Enviar mensaje al Super Admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el Super Admin de este Admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { superAdminId: true, name: true },
    })

    if (!admin?.superAdminId) {
      return NextResponse.json(
        { error: 'No tienes un Super Admin asignado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { content, imageUrl, messageType } = body

    if (!content) {
      return NextResponse.json(
        { error: 'El contenido es requerido' },
        { status: 400 }
      )
    }

    const message = await prisma.adminMessage.create({
      data: {
        content,
        imageUrl,
        messageType: messageType || 'GENERAL',
        senderId: session.user.id,
        receiverId: admin.superAdminId,
      },
      include: {
        sender: {
          select: { name: true },
        },
      },
    })

    // Crear notificación para el Super Admin
    await prisma.notification.create({
      data: {
        title: messageType === 'BILLING' ? '💰 Comprobante de pago recibido' :
               messageType === 'SUPPORT' ? '🛠️ Solicitud de soporte' :
               '💬 Nuevo mensaje',
        message: `${admin.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        type: messageType === 'BILLING' ? 'BILLING' : 'INFO',
        link: `/superadmin/messages?adminId=${session.user.id}`,
        userId: admin.superAdminId,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
