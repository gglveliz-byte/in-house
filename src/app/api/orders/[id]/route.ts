import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'
import { isValidTransition } from '@/lib/order-transitions'

// GET /api/orders/[id] - Obtener pedido por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            whatsapp: true,
            latitude: true,
            longitude: true,
            minDeliveryFee: true,
            maxDeliveryFee: true,
            paymentMethods: true,
          },
        },
        driver: {
          select: { name: true, phone: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Error al obtener pedido' }, { status: 500 })
  }
}

// PATCH /api/orders/[id] - Actualizar estado del pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, driverId } = body

    const session = await getServerSession(authOptions)

    // Validar transición de estado
    if (status) {
      const currentOrder = await prisma.order.findUnique({
        where: { id },
        select: { status: true },
      })

      if (!currentOrder) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
      }

      if (!isValidTransition(currentOrder.status, status)) {
        return NextResponse.json(
          { error: `No se puede cambiar de ${currentOrder.status} a ${status}` },
          { status: 400 }
        )
      }
    }

    // Si un repartidor acepta el pedido, validar zona y usuario
    if (driverId && session?.user?.role === 'DRIVER' && session.user.zoneId) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { store: { select: { zoneId: true } } },
      })

      if (!order) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
      }

      if (order.store.zoneId !== session.user.zoneId) {
        return NextResponse.json(
          { error: 'No puedes aceptar pedidos de otras zonas' },
          { status: 403 }
        )
      }

      if (driverId !== session.user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status

      const now = new Date()
      switch (status) {
        case 'CONFIRMED':
          updateData.confirmedAt = now
          break
        case 'READY':
          updateData.readyAt = now
          break
        case 'PICKED_UP':
          updateData.pickedUpAt = now
          break
        case 'DELIVERED':
          updateData.deliveredAt = now
          break
      }
    }

    if (driverId !== undefined) {
      updateData.driverId = driverId
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: { product: true },
        },
        store: true,
      },
    })

    try {
      const orderData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        storeName: order.store.name,
        customerName: order.customerName,
      }

      await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_UPDATED, orderData)
      await pusherServer.trigger(CHANNELS.STORE(order.storeId), EVENTS.ORDER_UPDATED, orderData)
      await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.ORDER_UPDATED, orderData)

      if (status === 'READY') {
        await pusherServer.trigger(CHANNELS.DRIVER, EVENTS.ORDER_READY, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          storeName: order.store.name,
          storeAddress: order.store.address,
          customerAddress: order.customerAddress,
          total: order.total,
        })

        // Notificar en segundo plano (push) a todos los repartidores activos de la zona
        if (order.zoneId) {
          try {
            const driversInZone = await prisma.user.findMany({
              where: { role: 'DRIVER', zoneId: order.zoneId },
              select: { id: true },
            })
            const { sendPushToUser } = await import('@/lib/push')
            for (const driverUser of driversInZone) {
              await sendPushToUser(driverUser.id, {
                title: '🛵 ¡Pedido Listo para Recoger!',
                body: `Pedido #${order.orderNumber} en ${order.store.name} listo para reparto.`,
                link: `/driver/active/${order.id}`,
              })
            }
          } catch (pushError) {
            console.error('Error sending ready push notifications to drivers in zone:', pushError)
          }
        }
      }

      if (status === 'PICKED_UP') {
        await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_PICKED_UP, {
          ...orderData,
          driverId: order.driverId,
        })

        // Notificar en segundo plano (push) al dueño del local
        if (order.store.ownerId) {
          try {
            const { sendPushToUser } = await import('@/lib/push')
            await sendPushToUser(order.store.ownerId, {
              title: '📦 Pedido Recogido',
              body: `El pedido #${order.orderNumber} ya va en camino al cliente.`,
              link: `/vendor/order/${order.id}`,
            })
          } catch (pushError) {
            console.error('Error sending picked up push notification to store owner:', pushError)
          }
        }
      }

      if (status === 'DELIVERED') {
        await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_DELIVERED, orderData)
      }

      if (status === 'CANCELLED') {
        await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_CANCELLED, orderData)
      }

      // Notificar al dueño del local si un repartidor ha aceptado el pedido
      if (driverId && order.store.ownerId) {
        try {
          const { sendPushToUser } = await import('@/lib/push')
          await sendPushToUser(order.store.ownerId, {
            title: '🛵 Repartidor Asignado',
            body: `El repartidor ha tomado el pedido #${order.orderNumber}.`,
            link: `/vendor/order/${order.id}`,
          })
        } catch (pushError) {
          console.error('Error sending driver assigned push notification to store owner:', pushError)
        }
      }
    } catch (pusherError) {
      console.warn('Pusher event error:', pusherError)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 })
  }
}
