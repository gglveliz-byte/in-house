import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

// GET /api/orders/[id]/messages - Obtener mensajes de un pedido
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 })
  }
}

// POST /api/orders/[id]/messages - Enviar un nuevo mensaje
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, imageUrl, senderType, senderName } = body

    // Validar senderType
    const validSenderTypes = ['CUSTOMER', 'VENDOR', 'DRIVER', 'SYSTEM']
    if (!senderType || !validSenderTypes.includes(senderType)) {
      return NextResponse.json({ error: 'Tipo de remitente inválido' }, { status: 400 })
    }

    // VENDOR, DRIVER y SYSTEM requieren autenticación
    if (senderType === 'VENDOR' || senderType === 'DRIVER' || senderType === 'SYSTEM') {
      const session = await getServerSession(authOptions)
      if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      
      if (senderType === 'DRIVER' && session.user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'No autorizado - Debe ser repartidor' }, { status: 403 })
      }
    }

    if (!content?.trim() && !imageUrl) {
      return NextResponse.json({ error: 'El mensaje debe tener contenido o imagen' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { store: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        orderId: id,
        content: content || '',
        imageUrl,
        senderType,
        senderName: senderName || (senderType === 'CUSTOMER' ? 'Cliente' : senderType === 'DRIVER' ? 'Repartidor' : 'Vendedor'),
      },
    })

    try {
      await pusherServer.trigger(CHANNELS.ORDER(id), EVENTS.NEW_MESSAGE, {
        message,
        orderId: id,
      })

      if (senderType === 'CUSTOMER') {
        await pusherServer.trigger(CHANNELS.STORE(order.storeId), EVENTS.NEW_MESSAGE, {
          orderId: id,
          orderNumber: order.orderNumber,
          senderName,
          content: content ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : 'Imagen',
        })
      }

      if (senderType === 'VENDOR') {
        await pusherServer.trigger(CHANNELS.ORDER(id), EVENTS.ORDER_UPDATED, {
          orderId: id,
          status: order.status,
        })
      }
    } catch (pusherError) {
      console.warn('Pusher event error:', pusherError)
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
