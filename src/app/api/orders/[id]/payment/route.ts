import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

// PATCH /api/orders/[id]/payment - Actualizar estado del pago
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { paymentStatus, paymentProof } = body

    // Actualizar el pedido
    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(paymentStatus && { paymentStatus }),
        ...(paymentProof && { paymentProof }),
      },
      include: {
        store: true,
      },
    })

    // Crear mensaje de sistema
    let systemMessage = ''
    if (paymentStatus === 'UPLOADED') {
      systemMessage = '📎 El cliente ha subido un comprobante de pago'
    } else if (paymentStatus === 'VERIFIED') {
      systemMessage = '✅ El vendedor ha verificado el pago'
    }

    if (systemMessage) {
      await prisma.message.create({
        data: {
          orderId: id,
          content: systemMessage,
          senderType: 'SYSTEM',
          senderName: 'Sistema',
        },
      })
    }

    // Emitir eventos por Pusher
    try {
      // Notificar al cliente
      await pusherServer.trigger(CHANNELS.ORDER(id), EVENTS.ORDER_UPDATED, {
        orderId: id,
        paymentStatus: order.paymentStatus,
      })

      // Si el pago fue verificado, notificar especialmente
      if (paymentStatus === 'VERIFIED') {
        await pusherServer.trigger(CHANNELS.ORDER(id), EVENTS.PAYMENT_VERIFIED, {
          orderId: id,
        })
      }

      // Notificar a la tienda cuando cambia el estado del pago
      await pusherServer.trigger(CHANNELS.STORE(order.storeId), EVENTS.ORDER_UPDATED, {
        orderId: id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
      })

      // Notificar a la tienda si el cliente subió comprobante (mensaje adicional)
      if (paymentStatus === 'UPLOADED') {
        await pusherServer.trigger(CHANNELS.STORE(order.storeId), EVENTS.NEW_MESSAGE, {
          orderId: id,
          orderNumber: order.orderNumber,
          senderName: 'Cliente',
          content: 'Subió comprobante de pago',
        })
      }
    } catch (pusherError) {
      console.warn('Pusher event error:', pusherError)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Error al actualizar pago' }, { status: 500 })
  }
}
