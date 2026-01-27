import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

// GET /api/orders/[id]/messages - Obtener mensajes de un pedido
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Verificar que el pedido existe
    const order = await prisma.order.findUnique({
      where: { id },
      include: { store: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Crear el mensaje
    const message = await prisma.message.create({
      data: {
        orderId: id,
        content,
        imageUrl,
        senderType, // CUSTOMER, VENDOR, SYSTEM
        senderName,
      },
    })

    // Emitir evento por Pusher para actualización en tiempo real
    try {
      await pusherServer.trigger(CHANNELS.ORDER(id), EVENTS.NEW_MESSAGE, {
        message,
        orderId: id,
      })

      // Si es un mensaje del cliente, notificar al vendedor
      if (senderType === 'CUSTOMER') {
        await pusherServer.trigger(CHANNELS.STORE(order.storeId), EVENTS.NEW_MESSAGE, {
          orderId: id,
          orderNumber: order.orderNumber,
          senderName,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        })
      }

      // Si es un mensaje del vendedor, notificar al cliente
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
