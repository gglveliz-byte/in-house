import { NextRequest, NextResponse } from 'next/server'
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

    // Validar que el valor esté dentro del rango
    const order = await prisma.order.findUnique({
      where: { id },
      include: { store: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Validar rango de envío
    if (actualDeliveryFee !== null && actualDeliveryFee !== undefined) {
      if (order.store.minDeliveryFee !== undefined && 
          order.store.maxDeliveryFee !== undefined &&
          order.store.maxDeliveryFee >= order.store.minDeliveryFee) {
        if (actualDeliveryFee < order.store.minDeliveryFee || actualDeliveryFee > order.store.maxDeliveryFee) {
          return NextResponse.json(
            { error: `El valor del envío debe estar entre ${order.store.minDeliveryFee} y ${order.store.maxDeliveryFee}` },
            { status: 400 }
          )
        }
      }
    }

    // Actualizar el pedido
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

    // Si el cliente confirmó el pago, actualizar el total (pero NO marcar como entregado todavía)
    // El repartidor debe validar y marcar como entregado manualmente
    if (deliveryPaymentStatus === 'PAID_CASH' || deliveryPaymentStatus === 'PAID_TRANSFER') {
      // Usar el actualDeliveryFee que ya está guardado o el que viene en el request
      const feeToUse = actualDeliveryFee !== null && actualDeliveryFee !== undefined 
        ? actualDeliveryFee 
        : order.actualDeliveryFee || 0
      const finalTotal = order.subtotal + feeToUse
      updateData.total = finalTotal
      // NO marcar como entregado automáticamente - el repartidor lo hará después de validar
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        store: true,
      },
    })

    // Emitir eventos por Pusher a todos los interesados
    try {
      const eventData = {
        orderId: id,
        orderNumber: order.orderNumber,
        status: updatedOrder.status,
        deliveryPaymentStatus: updatedOrder.deliveryPaymentStatus,
        deliveryPaymentProof: updatedOrder.deliveryPaymentProof,
        actualDeliveryFee: updatedOrder.actualDeliveryFee,
      }
      
      // 1. Notificar al cliente (canal del pedido)
      await pusherServer.trigger(CHANNELS.ORDER(id), EVENTS.ORDER_UPDATED, eventData)
      
      // 2. Notificar a los repartidores (para actualizar la vista activa)
      await pusherServer.trigger(CHANNELS.DRIVER, EVENTS.ORDER_UPDATED, eventData)
      
      // 3. Notificar a la tienda
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
