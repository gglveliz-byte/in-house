import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creando cuentas de prueba en Neon...\n')

  // 1. Super Admin
  const superAdminPwd = await hash('20021985FreeS@IN-HOUSE', 10)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'lveliz213@hotmail.com' },
    update: { password: superAdminPwd, role: 'SUPER_ADMIN' },
    create: {
      name: 'Super Admin',
      email: 'lveliz213@hotmail.com',
      password: superAdminPwd,
      role: 'SUPER_ADMIN',
      registeredAt: new Date(),
    },
  })
  console.log('✅ Super Admin:', superAdmin.email)

  // 2. Zona demo
  const zone = await prisma.zone.upsert({
    where: { id: 'zone-demo-001' },
    update: { name: 'Zona Demo - Centro' },
    create: {
      id: 'zone-demo-001',
      name: 'Zona Demo - Centro',
      description: 'Zona de prueba para testing',
      latitude: -2.1829,
      longitude: -79.5180,
      radius: 10,
      currency: 'USD',
      isActive: true,
    },
  })
  console.log('✅ Zona:', zone.name)

  // 3. Admin demo
  const adminPwd = await hash('Admin2024!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { password: adminPwd, role: 'ADMIN', zoneId: zone.id, superAdminId: superAdmin.id },
    create: {
      name: 'Admin Demo',
      email: 'admin@demo.com',
      password: adminPwd,
      role: 'ADMIN',
      phone: '+1 555 0101',
      zoneId: zone.id,
      superAdminId: superAdmin.id,
      registeredAt: new Date(),
    },
  })
  console.log('✅ Admin:', admin.email)

  // 4. Vendedor demo
  const vendorPwd = await hash('Vendor2024!', 12)
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@demo.com' },
    update: { password: vendorPwd, role: 'VENDOR', createdByAdminId: admin.id },
    create: {
      name: 'Vendedor Demo',
      email: 'vendor@demo.com',
      password: vendorPwd,
      role: 'VENDOR',
      phone: '+1 555 0202',
      createdByAdminId: admin.id,
    },
  })
  console.log('✅ Vendor:', vendor.email)

  // 5. Repartidor demo
  const driverPwd = await hash('Driver2024!', 12)
  const driver = await prisma.user.upsert({
    where: { email: 'driver@demo.com' },
    update: { password: driverPwd, role: 'DRIVER', zoneId: zone.id, createdByAdminId: admin.id },
    create: {
      name: 'Repartidor Demo',
      email: 'driver@demo.com',
      password: driverPwd,
      role: 'DRIVER',
      phone: '+1 555 0303',
      zoneId: zone.id,
      createdByAdminId: admin.id,
    },
  })
  console.log('✅ Driver:', driver.email)

  // 6. Tienda demo
  const store = await prisma.store.upsert({
    where: { slug: 'tienda-demo' },
    update: {
      name: 'Tienda Demo',
      logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=150&h=150&q=80',
      banner: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&h=400&q=80',
    },
    create: {
      name: 'Tienda Demo',
      slug: 'tienda-demo',
      description: 'Tienda de prueba - Hamburguesas y más',
      whatsapp: '+15550202',
      address: 'Av. Principal #123, Centro',
      isOpen: true,
      minOrder: 10,
      deliveryFee: 2.5,
      logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=150&h=150&q=80',
      banner: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&h=400&q=80',
      ownerId: vendor.id,
      zoneId: zone.id,
    },
  })
  console.log('✅ Tienda:', store.name, '→ /azul/restaurant/tienda-demo')

  // 7. Categorías
  const catHamb = await prisma.category.upsert({
    where: { id: 'cat-demo-hamburguesas' },
    update: {},
    create: { id: 'cat-demo-hamburguesas', name: 'Hamburguesas', storeId: store.id, order: 1 },
  })
  const catBeb = await prisma.category.upsert({
    where: { id: 'cat-demo-bebidas' },
    update: {},
    create: { id: 'cat-demo-bebidas', name: 'Bebidas', storeId: store.id, order: 2 },
  })

  // 8. Productos demo
  const productos = [
    { id: 'prod-demo-1', name: 'Hamburguesa Clásica', description: 'Carne, lechuga, tomate, salsa especial', price: 8.50, categoryId: catHamb.id, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
    { id: 'prod-demo-2', name: 'Hamburguesa Doble', description: 'Doble carne, queso, tocino', price: 12.00, categoryId: catHamb.id, image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80' },
    { id: 'prod-demo-3', name: 'Coca-Cola 500ml', description: 'Bebida fría', price: 2.50, categoryId: catBeb.id, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
    { id: 'prod-demo-4', name: 'Papas Fritas', description: 'Porción grande crujiente', price: 4.00, categoryId: null, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' },
  ]
  for (const p of productos) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        categoryId: p.categoryId,
      },
      create: { ...p, storeId: store.id, isAvailable: true },
    })
  }
  console.log('✅ Productos: 4 productos creados')

  // 9. Contador de pedidos
  await prisma.counter.upsert({
    where: { id: 'order_counter' },
    update: {},
    create: { id: 'order_counter', value: 1000 },
  })
  console.log('✅ Contador inicializado')

  console.log('\n' + '═'.repeat(52))
  console.log('🎉  CUENTAS LISTAS  —  In-House Delivery')
  console.log('═'.repeat(52))
  console.log('\n👑  SUPER ADMIN')
  console.log('    Email:    lveliz213@hotmail.com')
  console.log('    Pass:     20021985FreeS@IN-HOUSE')
  console.log('    URL:      /superadmin')
  console.log('\n👤  ADMIN')
  console.log('    Email:    admin@demo.com')
  console.log('    Pass:     Admin2024!')
  console.log('    URL:      /admin')
  console.log('\n🏪  VENDEDOR')
  console.log('    Email:    vendor@demo.com')
  console.log('    Pass:     Vendor2024!')
  console.log('    URL:      /vendor')
  console.log('\n🚗  REPARTIDOR')
  console.log('    Email:    driver@demo.com')
  console.log('    Pass:     Driver2024!')
  console.log('    URL:      /driver')
  console.log('\n🛒  APP CLIENTE')
  console.log('    URL:      /azul')
  console.log('    Tienda:   /azul/restaurant/tienda-demo')
  console.log('\n' + '═'.repeat(52))
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
