import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Limpiando base de datos...\n')

  // Eliminar en orden correcto por dependencias

  // 1. Mensajes de pedidos
  const deletedMessages = await prisma.message.deleteMany()
  console.log(`✓ Mensajes de pedidos eliminados: ${deletedMessages.count}`)

  // 2. Items de pedidos
  const deletedOrderItems = await prisma.orderItem.deleteMany()
  console.log(`✓ Items de pedidos eliminados: ${deletedOrderItems.count}`)

  // 3. Pedidos
  const deletedOrders = await prisma.order.deleteMany()
  console.log(`✓ Pedidos eliminados: ${deletedOrders.count}`)

  // 4. Productos
  const deletedProducts = await prisma.product.deleteMany()
  console.log(`✓ Productos eliminados: ${deletedProducts.count}`)

  // 5. Categorías
  const deletedCategories = await prisma.category.deleteMany()
  console.log(`✓ Categorías eliminadas: ${deletedCategories.count}`)

  // 6. Tiendas
  const deletedStores = await prisma.store.deleteMany()
  console.log(`✓ Tiendas eliminadas: ${deletedStores.count}`)

  // 7. Mensajes de admin
  const deletedAdminMessages = await prisma.adminMessage.deleteMany()
  console.log(`✓ Mensajes de admin eliminados: ${deletedAdminMessages.count}`)

  // 8. Notificaciones
  const deletedNotifications = await prisma.notification.deleteMany()
  console.log(`✓ Notificaciones eliminadas: ${deletedNotifications.count}`)

  // 9. Ciclos de facturación
  const deletedBillingCycles = await prisma.billingCycle.deleteMany()
  console.log(`✓ Ciclos de facturación eliminados: ${deletedBillingCycles.count}`)

  // 10. Usuarios (excepto SUPER_ADMIN)
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: {
        not: 'SUPER_ADMIN'
      }
    }
  })
  console.log(`✓ Usuarios eliminados: ${deletedUsers.count}`)

  // 11. Zonas
  const deletedZones = await prisma.zone.deleteMany()
  console.log(`✓ Zonas eliminadas: ${deletedZones.count}`)

  // Verificar Super Admin
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  console.log('\n✅ Base de datos limpia!')
  console.log(`👑 Super Admin conservado: ${superAdmin?.email}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
