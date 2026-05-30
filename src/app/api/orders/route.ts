import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

// GET /api/orders - Obtener pedidos (con filtros y paginación)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const driverId = searchParams.get('driverId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const session = await getServerSession(authOptions)

    const where: Record<string, unknown> = {}
    if (storeId) where.storeId = storeId
    if (driverId) where.driverId = driverId
    if (status) where.status = status

    if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      where.store = { zoneId: session.user.zoneId }
    }

    if (session?.user?.role === 'DRIVER' && session.user.zoneId) {
      where.store = { zoneId: session.user.zoneId }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: { product: true },
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
            select: { name: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
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
      couponCode,
      paymentMethod,
    } = body

    // Validación de inputs
    if (!storeId || !customerName?.trim() || !customerPhone?.trim() || !customerAddress?.trim()) {
      return NextResponse.json(
        { error: 'Tienda, nombre, teléfono y dirección son requeridos' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe tener al menos un producto' },
        { status: 400 }
      )
    }

    if (customerPhone.trim().length < 7) {
      return NextResponse.json(
        { error: 'Número de teléfono inválido' },
        { status: 400 }
      )
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        zoneId: true,
        minDeliveryFee: true,
        maxDeliveryFee: true,
        deliveryFee: true,
        ownerId: true,
      },
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

      if (!item.quantity || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        throw new Error(`Cantidad inválida para producto ${item.productId}`)
      }

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

    let deliveryFee = 1.00
    if (store.deliveryFee && store.deliveryFee > 0) {
      deliveryFee = store.deliveryFee
    } else if (store.minDeliveryFee > 0 || store.maxDeliveryFee > 0) {
      deliveryFee = (store.minDeliveryFee + store.maxDeliveryFee) / 2
      if (deliveryFee === 0) {
        deliveryFee = 1.00
      }
    }

    // Aplicar descuento por cupón
    const code = couponCode?.trim().toUpperCase()
    if (code === 'BLUE50') {
      deliveryFee = deliveryFee * 0.5
    } else if (code === 'BIENVENIDO') {
      deliveryFee = 0.00
    }

    const total = subtotal + deliveryFee

    // Transacción atómica para evitar race condition en counter
    const order = await prisma.$transaction(async (tx) => {
      const counter = await tx.counter.upsert({
        where: { id: 'order_counter' },
        update: { value: { increment: 1 } },
        create: { id: 'order_counter', value: 1001 },
      })

      return tx.order.create({
        data: {
          storeId,
          zoneId: store.zoneId,
          orderNumber: counter.value,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          customerLat,
          customerLng,
          customerNotes: customerNotes?.trim() || null,
          paymentMethod: paymentMethod || 'CASH',
          subtotal,
          deliveryFee,
          total,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          store: true,
        },
      })
    })

    // Si hay un cliente autenticado, guardar/actualizar su teléfono en base de datos
    const session = await getServerSession(authOptions)
    if (session?.user?.id && session.user.role === 'CUSTOMER') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone: customerPhone.trim() },
      }).catch((err) => console.error('Error updating customer phone:', err))
    }

    try {
      await pusherServer.trigger(CHANNELS.STORE(storeId), EVENTS.NEW_ORDER, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
      })

      await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.NEW_ORDER, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeName: store.name,
        customerName: order.customerName,
        total: order.total,
      })

      await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_UPDATED, {
        orderId: order.id,
        status: order.status,
        orderNumber: order.orderNumber,
      })
    } catch (pusherError) {
      console.warn('Pusher event error:', pusherError)
    }

    // Enviar notificación Push de fondo al dueño del local (vendedor)
    if (store.ownerId) {
      try {
        const { sendPushToUser } = await import('@/lib/push')
        await sendPushToUser(store.ownerId, {
          title: '¡Nuevo Pedido Recibido! 🛍️',
          body: `Pedido #${order.orderNumber} por ${order.customerName} - Total: $${order.total.toFixed(2)}`,
          link: `/vendor/order/${order.id}`
        })
      } catch (pushError) {
        console.error('Error sending new order push notification to store owner:', pushError)
      }
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 })
  }
}
