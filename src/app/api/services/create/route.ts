import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      zoneId,
      serviceType, // 'ENVIO' | 'ENCARGO'
      customerName,
      customerPhone,
      customerAddress, // Punto de origen / recogida
      deliveryAddress, // Punto de destino / entrega
      customerLat,
      customerLng,
      details,         // Detalles del paquete o pedido de encargo
      price            // Tarifa del servicio
    } = body

    if (!zoneId || !customerName?.trim() || !customerPhone?.trim() || !customerAddress?.trim() || !deliveryAddress?.trim()) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios son requeridos (zona, nombre, teléfono, origen, destino)' },
        { status: 400 }
      )
    }

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId }
    })

    if (!zone) {
      return NextResponse.json({ error: 'Zona no encontrada' }, { status: 404 })
    }

    // 1. Obtener o crear tienda virtual de servicios en la zona
    let store = await prisma.store.findFirst({
      where: { 
        zoneId,
        slug: `servicios-express-${zoneId}`
      }
    })

    if (!store) {
      // Buscar un usuario administrador para asociar el local
      const admin = await prisma.user.findFirst({
        where: { zoneId, role: 'ADMIN' }
      }) || await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      })

      if (!admin) {
        return NextResponse.json({ error: 'No se encontró un usuario administrador para configurar la tienda virtual de servicios.' }, { status: 500 })
      }

      store = await prisma.store.create({
        data: {
          name: `Servicios Express - ${zone.name}`,
          slug: `servicios-express-${zoneId}`,
          description: 'Servicios virtuales de encomiendas, envíos y encargos a domicilio',
          whatsapp: admin.phone || '0999999999',
          address: zone.name,
          isOpen: true,
          ownerId: admin.id,
          zoneId
        }
      })
    }

    // 2. Obtener o crear producto virtual en la tienda
    let product = await prisma.product.findFirst({
      where: { storeId: store.id }
    })

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: 'Servicio de Courier Express',
          description: 'Servicios de logística y mensajería urbana express',
          price: 0.0,
          isAvailable: true,
          storeId: store.id
        }
      })
    }

    // 3. Crear notas integradas del despacho (Origen, Destino y Detalles)
    const integratedNotes = `📍 PUNTO DE RECOGIDA: ${customerAddress.trim()}\n🏁 DIRECCIÓN DE ENTREGA: ${deliveryAddress.trim()}\n📝 DETALLES DEL SERVICIO: ${details?.trim() || 'Sin especificaciones adicionales'}`

    // 4. Crear el pedido en estado 'READY' (Listo para que lo tomen los conductores)
    const order = await prisma.$transaction(async (tx) => {
      const counter = await tx.counter.upsert({
        where: { id: 'order_counter' },
        update: { value: { increment: 1 } },
        create: { id: 'order_counter', value: 1001 }
      })

      return tx.order.create({
        data: {
          storeId: store!.id,
          zoneId,
          orderNumber: counter.value,
          status: 'READY', // Listo para que los conductores lo tomen en su feed
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: `Recogida: ${customerAddress.substring(0, 50)}...`,
          customerLat,
          customerLng,
          customerNotes: integratedNotes,
          subtotal: 0.0,
          deliveryFee: price,
          total: price,
          items: {
            create: [
              {
                productId: product!.id,
                quantity: 1,
                unitPrice: 0.0,
                totalPrice: 0.0,
                notes: serviceType === 'ENVIO' ? 'Envío de Encomienda' : 'Encargo de Compra/Recogida'
              }
            ]
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          store: true
        }
      })
    })

    // 5. Transmitir eventos en tiempo real vía Pusher
    try {
      await pusherServer.trigger(CHANNELS.DRIVER, EVENTS.ORDER_READY, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeName: store.name,
        customerName: order.customerName,
        total: order.total
      })

      await pusherServer.trigger(CHANNELS.ADMIN, EVENTS.NEW_ORDER, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeName: store.name,
        customerName: order.customerName,
        total: order.total
      })

      await pusherServer.trigger(CHANNELS.ORDER(order.id), EVENTS.ORDER_UPDATED, {
        orderId: order.id,
        status: order.status,
        orderNumber: order.orderNumber
      })
    } catch (pusherError) {
      console.warn('Pusher events trigger failed:', pusherError)
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating custom service order:', error)
    return NextResponse.json({ error: 'Error interno del servidor al procesar el servicio' }, { status: 500 })
  }
}
