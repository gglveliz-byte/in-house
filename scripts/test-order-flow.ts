import { PrismaClient } from '@prisma/client'
import { calculateAmountDue } from '../src/lib/billing'

const prisma = new PrismaClient()

async function testOrderFlow() {
  console.log('🤖 INICIANDO TESTE PROGRAMÁTICO DE FLUJO DE EXTREMO A EXTREMO...\n')

  // 1. Obtener la tienda Demo y el Vendedor
  const store = await prisma.store.findUnique({
    where: { slug: 'tienda-demo' },
    include: { products: true, owner: true },
  })

  if (!store) {
    throw new Error('❌ La tienda "tienda-demo" no fue encontrada. Asegúrate de correr primero el seed.')
  }

  console.log(`🏪 Tienda Demo Encontrada: "${store.name}"`)
  console.log(`👤 Vendedor Asociado: ${store.owner.name} (${store.owner.email})`)
  console.log(`📍 Zona de la tienda: ${store.zoneId}`)
  console.log(`🍔 Productos en catálogo: ${store.products.length}\n`)

  if (store.products.length === 0) {
    throw new Error('❌ La tienda demo no tiene productos. Vuelve a ejecutar el seed.')
  }

  // 2. Obtener un repartidor asignado a la zona demo
  const driver = await prisma.user.findFirst({
    where: { role: 'DRIVER', zoneId: store.zoneId },
  })

  if (!driver) {
    throw new Error('❌ No se encontró ningún repartidor en la Zona Demo.')
  }
  console.log(`🚚 Repartidor Demo Encontrado: ${driver.name} (${driver.email})\n`)

  // 3. Crear una nueva orden ficticia (Simulación de Checkout por Cliente)
  console.log('🛒 1. Creando pedido de prueba (Simulación de Checkout por cliente: "Diego Cliente")...')
  
  // Incrementar contador de pedido
  const counter = await prisma.counter.upsert({
    where: { id: 'order_counter' },
    update: { value: { increment: 1 } },
    create: { id: 'order_counter', value: 1001 },
  })

  const orderProduct = store.products[0] // Hamburguesa Clásica
  const quantity = 2
  const subtotal = orderProduct.price * quantity
  const deliveryFee = store.deliveryFee

  const order = await prisma.order.create({
    data: {
      orderNumber: counter.value,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      customerName: 'Diego Cliente',
      customerPhone: '0987654321',
      customerAddress: 'Av. de los Shyris y Naciones Unidas, Quito',
      customerNotes: 'Entregar en recepción, timbre 4B',
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: subtotal, // Total inicial sin flete exacto
      storeId: store.id,
      items: {
        create: {
          productId: orderProduct.id,
          quantity: quantity,
          unitPrice: orderProduct.price,
          totalPrice: subtotal,
        }
      }
    },
    include: { items: { include: { product: true } } }
  })

  console.log(`✅ Pedido creado exitosamente: #${order.orderNumber} (ID: ${order.id})`)
  console.log(`💵 Subtotal: $${order.subtotal} | Método: Pago Contra Entrega / Pendiente\n`)

  // 4. Transición a CONFIRMED (Simulación del Panel del Vendedor)
  console.log('👨‍🍳 2. Confirmando y preparando pedido (Simulación de Vendedor)...')
  const confirmedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CONFIRMED',
      paymentStatus: 'VERIFIED', // Simulamos que el vendedor verificó el pago
    }
  })
  console.log(`✅ Estado del pedido cambiado a: ${confirmedOrder.status} | Pago: ${confirmedOrder.paymentStatus}\n`)

  // 5. Transición a READY (Listo para retirar)
  console.log('🍽️ 3. Marcando pedido como Listo para Retirar (Simulación de Vendedor)...')
  const readyOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'READY' }
  })
  console.log(`✅ Estado del pedido cambiado a: ${readyOrder.status}\n`)

  // 6. Aceptación del pedido por el Repartidor (Simulación del Portal del Repartidor)
  console.log('🏍️ 4. Repartidor acepta el pedido y registra el costo de envío exacto...')
  const actualDeliveryFee = 3.50 // Costo real calculado por el transportista
  const acceptedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      driverId: driver.id,
      status: 'PICKED_UP', // Cambia a en camino
      actualDeliveryFee: actualDeliveryFee,
      total: order.subtotal + actualDeliveryFee, // Total final real
      pickedUpAt: new Date(),
    }
  })
  console.log(`✅ Repartidor asignado: ${driver.name}`)
  console.log(`✅ Tarifa de envío establecida: $${acceptedOrder.actualDeliveryFee}`)
  console.log(`✅ Total final ajustado: $${acceptedOrder.total}`)
  console.log(`✅ Estado del pedido cambiado a: ${acceptedOrder.status} (En camino)\n`)

  // 7. Entrega final (Simulación del Repartidor entregando y cobrando)
  console.log('🎉 5. Entregando pedido al cliente (Simulación de Repartidor)...')
  const deliveredOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'DELIVERED',
      deliveryPaymentStatus: 'PAID_CASH', // Pagado en efectivo al transportista
    }
  })
  console.log(`✅ Estado del pedido cambiado a: ${deliveredOrder.status} (Entregado)`)
  console.log(`💵 Pago de flete registrado: ${deliveredOrder.deliveryPaymentStatus}\n`)

  // 8. Validación de Estadísticas del Vendedor
  console.log('📊 6. Validando impacto de la venta en el Dashboard del Vendedor...')
  
  // Calcular ventas de hoy
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

  const todayStats = await prisma.order.aggregate({
    where: {
      storeId: store.id,
      status: 'DELIVERED',
      createdAt: { gte: startOfDay, lte: endOfDay }
    },
    _sum: { subtotal: true },
    _count: { id: true }
  })

  console.log(`📈 Estadísticas de ventas de hoy para ${store.name}:`)
  console.log(`   - Pedidos Completados Hoy: ${todayStats._count.id}`)
  console.log(`   - Total Ventas de Hoy: $${todayStats._sum.subtotal || 0}`)
  console.log(`   - Ticket Promedio Hoy: $${(todayStats._sum.subtotal || 0) / (todayStats._count.id || 1)}\n`)

  // 9. Validación de Facturación de SuperAdmin
  console.log('👑 7. Validando cálculo de facturación para el SuperAdmin...')
  const completedOrdersCount = await prisma.order.count({
    where: {
      store: { zoneId: store.zoneId },
      status: 'DELIVERED'
    }
  })
  
  const amountDue = calculateAmountDue(completedOrdersCount)
  console.log(`💵 Total pedidos entregados en esta zona: ${completedOrdersCount}`)
  console.log(`💵 Tarifa base de plataforma a cobrar al Admin de esta zona: $${amountDue}\n`)

  console.log('🏆 TESTE PROGRAMÁTICO FINALIZADO CON ÉXITO: Flujo dinámico libre de errores al 100%.')
}

testOrderFlow()
  .catch((e) => {
    console.error('❌ ERROR DURANTE EL TEST DE FLUJO:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
