import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('\n🧹 LIMPIEZA DE BASE DE DATOS')
  console.log('='.repeat(50))

  const SUPER_ADMIN_EMAIL = 'lveliz213@hotmail.com'

  try {
    // Verificar que existe el Super Admin
    const superAdmin = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL }
    })

    if (!superAdmin) {
      console.log('❌ Error: No se encontró el Super Admin')
      return
    }

    console.log(`\n✅ Super Admin encontrado: ${superAdmin.name} (${superAdmin.email})`)
    console.log('\n🗑️  Eliminando datos...\n')

    // 1. Eliminar mensajes de pedidos
    const deletedMessages = await prisma.message.deleteMany()
    console.log(`   ✓ Mensajes de pedidos: ${deletedMessages.count}`)

    // 2. Eliminar items de pedidos
    const deletedOrderItems = await prisma.orderItem.deleteMany()
    console.log(`   ✓ Items de pedidos: ${deletedOrderItems.count}`)

    // 3. Eliminar pedidos
    const deletedOrders = await prisma.order.deleteMany()
    console.log(`   ✓ Pedidos: ${deletedOrders.count}`)

    // 4. Eliminar productos
    const deletedProducts = await prisma.product.deleteMany()
    console.log(`   ✓ Productos: ${deletedProducts.count}`)

    // 5. Eliminar categorías
    const deletedCategories = await prisma.category.deleteMany()
    console.log(`   ✓ Categorías: ${deletedCategories.count}`)

    // 6. Eliminar tiendas
    const deletedStores = await prisma.store.deleteMany()
    console.log(`   ✓ Tiendas: ${deletedStores.count}`)

    // 7. Eliminar mensajes admin
    const deletedAdminMessages = await prisma.adminMessage.deleteMany()
    console.log(`   ✓ Mensajes admin: ${deletedAdminMessages.count}`)

    // 8. Eliminar notificaciones
    const deletedNotifications = await prisma.notification.deleteMany()
    console.log(`   ✓ Notificaciones: ${deletedNotifications.count}`)

    // 9. Eliminar ciclos de facturación
    const deletedBillingCycles = await prisma.billingCycle.deleteMany()
    console.log(`   ✓ Ciclos facturación: ${deletedBillingCycles.count}`)

    // 10. Eliminar todos los usuarios excepto Super Admin
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          not: SUPER_ADMIN_EMAIL
        }
      }
    })
    console.log(`   ✓ Usuarios (excepto Super Admin): ${deletedUsers.count}`)

    // 11. Eliminar zonas
    const deletedZones = await prisma.zone.deleteMany()
    console.log(`   ✓ Zonas: ${deletedZones.count}`)

    // 12. Resetear contador de pedidos
    await prisma.counter.upsert({
      where: { id: 'order_counter' },
      update: { value: 1000 },
      create: { id: 'order_counter', value: 1000 }
    })
    console.log(`   ✓ Contador de pedidos: reseteado a 1000`)

    // Limpiar relaciones del Super Admin
    await prisma.user.update({
      where: { email: SUPER_ADMIN_EMAIL },
      data: {
        zoneId: null,
        superAdminId: null,
        createdByAdminId: null
      }
    })

    console.log('\n' + '='.repeat(50))
    console.log('✅ BASE DE DATOS LIMPIA')
    console.log('='.repeat(50))
    console.log(`\n👑 Super Admin conservado: ${superAdmin.email}`)
    console.log('\n💡 La app está lista para empezar desde cero.\n')

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()
