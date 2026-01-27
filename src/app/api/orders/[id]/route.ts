import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

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
          include: {
            product: true,
          },
        },
        store: true,
        driver: {
          select: {
            name: true,
            phone: true,
          },
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

    // Obtener sesión para validar autorización
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)

    // Si un repartidor está aceptando el pedido, validar que pertenece a su zona
    if (driverId && session?.user?.role === 'DRIVER' && session.user.zoneId) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { store: { select: { zoneId: true } } },
      })

      if (!order) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
      }

      // Verificar que el pedido pertenece a la zona del repartidor
      if (order.store.zoneId !== session.user.zoneId) {
        return NextResponse.json(
          { error: 'No puedes aceptar pedidos de otras zonas' },
          { status: 403 }
        )
      }

      // Verificar que el driverId coincide con el usuario autenticado
      if (driverId !== session.user.id) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 403 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status

      // Actualizar timestamps según el estado
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
          include: {
            product: true,
          },
        },
        store: true,
      },
    })

    // Emitir eventos por Pusher a todos los roles
    try {
      const orderData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        storeName: order.store.name,
        customerName: order.customerName,
      }
      
      // 1. Notificar al CLIENTE (canal específico del pedido)
      await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_UPDATED, orderData)
      
      // 2. Notificar a la TIENDA
      await pusherServer.trigger(CHANNELS.STORE(order.storeId), EVENTS.ORDER_UPDATED, orderData)
      
      // 3. Notificar al ADMIN
      await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.ORDER_UPDATED, orderData)

      // 4. Si está LISTO, notificar a los REPARTIDORES
      if (status === 'READY') {
        await pusherServer.trigger(CHANNELS.DRIVER, EVENTS.ORDER_READY, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          storeName: order.store.name,
          storeAddress: order.store.address,
          customerAddress: order.customerAddress,
          total: order.total,
        })
      }
      
      // 5. Si está RECOGIDO, notificar con evento específico
      if (status === 'PICKED_UP') {
        await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_PICKED_UP, {
          ...orderData,
          driverId: order.driverId,
        })
      }
      
      // 6. Si está ENTREGADO, notificar con evento específico
      if (status === 'DELIVERED') {
        await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_DELIVERED, orderData)
      }
      
      // 7. Si está CANCELADO, notificar con evento específico
      if (status === 'CANCELLED') {
        await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_CANCELLED, orderData)
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
