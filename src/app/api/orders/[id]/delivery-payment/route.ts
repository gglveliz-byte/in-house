import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

// PATCH /api/orders/[id]/delivery-payment - Actualizar pago del envío
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { actualDeliveryFee, deliveryPaymentStatus, deliveryPaymentProof } = body

    // Validar estados permitidos
    const validStatuses = ['PENDING', 'PAID_CASH', 'PAID_TRANSFER']
    if (deliveryPaymentStatus && !validStatuses.includes(deliveryPaymentStatus)) {
      return NextResponse.json({ error: 'Estado de pago de delivery inválido' }, { status: 400 })
    }

    // Validar que el valor del delivery fee sea un número positivo
    if (actualDeliveryFee !== null && actualDeliveryFee !== undefined) {
      if (typeof actualDeliveryFee !== 'number' || actualDeliveryFee < 0) {
        return NextResponse.json({ error: 'Valor de envío inválido' }, { status: 400 })
      }
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { store: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Validar rango de envío
    if (actualDeliveryFee !== null && actualDeliveryFee !== undefined) {
      const hasRange = order.store.minDeliveryFee > 0 || order.store.maxDeliveryFee > 0
      if (hasRange) {
        if (actualDeliveryFee < order.store.minDeliveryFee || actualDeliveryFee > order.store.maxDeliveryFee) {
          return NextResponse.json(
            { error: `El valor del envío debe estar entre ${order.store.minDeliveryFee} y ${order.store.maxDeliveryFee}` },
            { status: 400 }
          )
        }
      }
    }

    const updateData: Record<string, unknown> = {}

    if (actualDeliveryFee !== null && actualDeliveryFee !== undefined) {
      updateData.actualDeliveryFee = actualDeliveryFee
    }

    if (deliveryPaymentStatus) {
      updateData.deliveryPaymentStatus = deliveryPaymentStatus
    }

    if (deliveryPaymentProof !== undefined) {
      updateData.deliveryPaymentProof = deliveryPaymentProof
    }

    if (deliveryPaymentStatus === 'PAID_CASH' || deliveryPaymentStatus === 'PAID_TRANSFER') {
      const feeToUse = actualDeliveryFee !== null && actualDeliveryFee !== undefined
        ? actualDeliveryFee
        : order.actualDeliveryFee || 0
      updateData.total = order.subtotal + feeToUse
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { store: true },
    })

    try {
      const eventData = {
        orderId: id,
        orderNumber: order.orderNumber,
        status: updatedOrder.status,
        deliveryPaymentStatus: updatedOrder.deliveryPaymentStatus,
        deliveryPaymentProof: updatedOrder.deliveryPaymentProof,
        actualDeliveryFee: updatedOrder.actualDeliveryFee,
      }

      await pusherServer.trigger(CHANNELS.ORDER(id), EVENTS.ORDER_UPDATED, eventData)
      await pusherServer.trigger(CHANNELS.DRIVER, EVENTS.ORDER_UPDATED, eventData)
      await pusherServer.trigger(CHANNELS.STORE(order.storeId), EVENTS.ORDER_UPDATED, eventData)
    } catch (pusherError) {
      console.warn('Pusher event error:', pusherError)
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating delivery payment:', error)
    return NextResponse.json({ error: 'Error al actualizar pago del envío' }, { status: 500 })
  }
}
