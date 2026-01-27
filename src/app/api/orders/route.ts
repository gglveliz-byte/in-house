import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

// GET /api/orders - Obtener pedidos (con filtros)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const driverId = searchParams.get('driverId')
    const status = searchParams.get('status')

    // Obtener sesión para filtrar por zona si es admin
    const session = await getServerSession(authOptions)

    const where: Record<string, unknown> = {}
    if (storeId) where.storeId = storeId
    if (driverId) where.driverId = driverId
    if (status) where.status = status
    
    // Si es admin, solo ver pedidos de tiendas en su zona
    if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      where.store = {
        zoneId: session.user.zoneId
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        store: {
          select: {
            name: true,
            address: true,
            whatsapp: true,
            minDeliveryFee: true,
            maxDeliveryFee: true,
          },
        },
        driver: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 })
  }
}

// POST /api/orders - Crear nuevo pedido (público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      storeId,
      customerName,
      customerPhone,
      customerAddress,
      customerLat,
      customerLng,
      customerNotes,
      items,
    } = body

    // Obtener info de la tienda
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    })

    if (!store) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
    }

    // Calcular totales
    const productIds = items.map((item: { productId: string }) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    let subtotal = 0
    const orderItems = items.map((item: { productId: string; quantity: number; notes?: string }) => {
      const product = productMap.get(item.productId)
      if (!product) throw new Error(`Producto ${item.productId} no encontrado`)

      const totalPrice = product.price * item.quantity
      subtotal += totalPrice

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice,
        notes: item.notes || null,
      }
    })

    // Si hay rango de envío configurado, no incluir en el total (se cobrará al entregar)
    // Si no hay rango, usar el deliveryFee fijo
    const hasDeliveryRange = store.minDeliveryFee !== undefined && 
                             store.maxDeliveryFee !== undefined &&
                             store.maxDeliveryFee >= store.minDeliveryFee
    const total = hasDeliveryRange ? subtotal : subtotal + store.deliveryFee

    // Obtener y actualizar el contador de pedidos
    const counter = await prisma.counter.upsert({
      where: { id: 'order_counter' },
      update: { value: { increment: 1 } },
      create: { id: 'order_counter', value: 1001 },
    })

    // Crear el pedido
    const order = await prisma.order.create({
      data: {
        storeId,
        orderNumber: counter.value,
        customerName,
        customerPhone,
        customerAddress,
        customerLat,
        customerLng,
        customerNotes,
        subtotal,
        deliveryFee: hasDeliveryRange ? 0 : store.deliveryFee, // 0 si hay rango, se cobrará al entregar
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        store: true,
      },
    })

    // Emitir eventos de nuevo pedido por Pusher
    try {
      // Notificar a la tienda
      await pusherServer.trigger(CHANNELS.STORE(storeId), EVENTS.NEW_ORDER, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
      })
      
      // Notificar al admin
      await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.NEW_ORDER, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeName: store.name,
        customerName: order.customerName,
        total: order.total,
      })
      
      // Crear canal para que el cliente pueda escuchar actualizaciones
      await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_UPDATED, {
        orderId: order.id,
        status: order.status,
        orderNumber: order.orderNumber,
      })
    } catch (pusherError) {
      console.warn('Pusher event error:', pusherError)
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 })
  }
}
