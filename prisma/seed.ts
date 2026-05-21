import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with unified demo environments...')

  // 1. Crear usuario Super Admin
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
  console.log('✅ Super Admin created:', superAdmin.email)

  // ==========================================================================
  // ENTORNO 1: ZONA DEMO - CENTRO (Guayaquil/Demo)
  // ==========================================================================
  
  // 2. Zona demo
  const zoneDemo = await prisma.zone.upsert({
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
  console.log('✅ Zone Demo created:', zoneDemo.name)

  // 3. Admin demo
  const adminDemoPwd = await hash('Admin2024!', 12)
  const adminDemo = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { password: adminDemoPwd, role: 'ADMIN', zoneId: zoneDemo.id, superAdminId: superAdmin.id },
    create: {
      name: 'Admin Demo',
      email: 'admin@demo.com',
      password: adminDemoPwd,
      role: 'ADMIN',
      phone: '+1 555 0101',
      zoneId: zoneDemo.id,
      superAdminId: superAdmin.id,
      registeredAt: new Date(),
    },
  })
  console.log('✅ Admin Demo created:', adminDemo.email)

  // 4. Vendedor demo
  const vendorDemoPwd = await hash('Vendor2024!', 12)
  const vendorDemo = await prisma.user.upsert({
    where: { email: 'vendor@demo.com' },
    update: { password: vendorDemoPwd, role: 'VENDOR', createdByAdminId: adminDemo.id },
    create: {
      name: 'Vendedor Demo',
      email: 'vendor@demo.com',
      password: vendorDemoPwd,
      role: 'VENDOR',
      phone: '+1 555 0202',
      createdByAdminId: adminDemo.id,
    },
  })
  console.log('✅ Vendor Demo created:', vendorDemo.email)

  // 5. Repartidor demo
  const driverDemoPwd = await hash('Driver2024!', 12)
  const driverDemo = await prisma.user.upsert({
    where: { email: 'driver@demo.com' },
    update: { password: driverDemoPwd, role: 'DRIVER', zoneId: zoneDemo.id, createdByAdminId: adminDemo.id },
    create: {
      name: 'Repartidor Demo',
      email: 'driver@demo.com',
      password: driverDemoPwd,
      role: 'DRIVER',
      phone: '+1 555 0303',
      zoneId: zoneDemo.id,
      createdByAdminId: adminDemo.id,
    },
  })
  console.log('✅ Driver Demo created:', driverDemo.email)

  // 6. Tienda demo
  const storeDemo = await prisma.store.upsert({
    where: { slug: 'tienda-demo' },
    update: {
      name: 'Tienda Demo',
      logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=150&h=150&q=80',
      banner: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&h=400&q=80',
      zoneId: zoneDemo.id,
      ownerId: vendorDemo.id,
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
      ownerId: vendorDemo.id,
      zoneId: zoneDemo.id,
    },
  })
  console.log('✅ Store Demo created:', storeDemo.name)

  // 7. Categorías Demo
  const catHambDemo = await prisma.category.upsert({
    where: { id: 'cat-demo-hamburguesas' },
    update: {},
    create: { id: 'cat-demo-hamburguesas', name: 'Hamburguesas', storeId: storeDemo.id, order: 1 },
  })
  const catBebDemo = await prisma.category.upsert({
    where: { id: 'cat-demo-bebidas' },
    update: {},
    create: { id: 'cat-demo-bebidas', name: 'Bebidas', storeId: storeDemo.id, order: 2 },
  })

  // 8. Productos Demo
  const productosDemo = [
    { id: 'prod-demo-1', name: 'Hamburguesa Clásica', description: 'Carne, lechuga, tomate, salsa especial', price: 8.50, categoryId: catHambDemo.id, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
    { id: 'prod-demo-2', name: 'Hamburguesa Doble', description: 'Doble carne, queso, tocino', price: 12.00, categoryId: catHambDemo.id, image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80' },
    { id: 'prod-demo-3', name: 'Coca-Cola 500ml', description: 'Bebida fría', price: 2.50, categoryId: catBebDemo.id, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
    { id: 'prod-demo-4', name: 'Papas Fritas', description: 'Porción grande crujiente', price: 4.00, categoryId: null, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' },
  ]
  for (const p of productosDemo) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        categoryId: p.categoryId,
      },
      create: { ...p, storeId: storeDemo.id, isAvailable: true },
    })
  }
  console.log('✅ Demo products created')


  // ==========================================================================
  // ENTORNO 2: ECUADOR NACIONAL (Inhouse / EcuFletes)
  // ==========================================================================

  // 9. Zona Ecuador
  const zoneEcuador = await prisma.zone.upsert({
    where: { id: 'zone-ecuador-001' },
    update: { name: 'Ecuador Nacional' },
    create: {
      id: 'zone-ecuador-001',
      name: 'Ecuador Nacional',
      description: 'Cobertura nacional en Ecuador',
      latitude: -1.8312,
      longitude: -78.1834,
      radius: 500,
      currency: 'USD',
      isActive: true,
    },
  })
  console.log('✅ Zone Ecuador created:', zoneEcuador.name)

  // 10. Admin inhouse
  const adminPwd = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@inhouse.com' },
    update: { password: adminPwd, role: 'ADMIN', zoneId: zoneEcuador.id, superAdminId: superAdmin.id },
    create: {
      name: 'Central EcuFletes (Admin)',
      email: 'admin@inhouse.com',
      password: adminPwd,
      role: 'ADMIN',
      phone: '0998765432',
      zoneId: zoneEcuador.id,
      superAdminId: superAdmin.id,
    },
  })
  console.log('✅ Admin In-House created:', admin.email)

  // 11. Vendedor inhouse
  const vendorPassword = await hash('vendor123', 12)
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@inhouse.com' },
    update: { password: vendorPassword, role: 'VENDOR', createdByAdminId: admin.id },
    create: {
      name: 'Corporación Cacao Ecuador (Cliente)',
      email: 'vendor@inhouse.com',
      password: vendorPassword,
      role: 'VENDOR',
      phone: '0971234567',
      createdByAdminId: admin.id,
    },
  })
  console.log('✅ Vendor In-House created:', vendor.email)

  // 12. Tienda hamburguesas el rey
  const store = await prisma.store.upsert({
    where: { slug: 'hamburguesas-el-rey' },
    update: { zoneId: zoneEcuador.id, ownerId: vendor.id },
    create: {
      name: 'Hamburguesas El Rey',
      slug: 'hamburguesas-el-rey',
      description: 'Las mejores hamburguesas de la ciudad',
      whatsapp: '5512345678',
      address: 'Av. Principal #123, Centro',
      isOpen: true,
      minOrder: 50,
      deliveryFee: 25,
      ownerId: vendor.id,
      zoneId: zoneEcuador.id,
    },
  })
  console.log('✅ Store In-House created:', store.name)

  // 13. Categorías In-house
  const bebidas = await prisma.category.upsert({
    where: { id: 'cat-bebidas' },
    update: {},
    create: {
      id: 'cat-bebidas',
      name: 'Bebidas',
      storeId: store.id,
      order: 2,
    },
  })

  const hamburguesas = await prisma.category.upsert({
    where: { id: 'cat-hamburguesas' },
    update: {},
    create: {
      id: 'cat-hamburguesas',
      name: 'Hamburguesas',
      storeId: store.id,
      order: 1,
    },
  })

  // 14. Productos Inhouse
  const products = [
    { name: 'Hamburguesa Clásica', description: 'Carne de res, lechuga, tomate, cebolla y salsa especial', price: 89, categoryId: hamburguesas.id },
    { name: 'Hamburguesa Doble', description: 'Doble carne de res, doble queso, tocino y jalapeños', price: 129, categoryId: hamburguesas.id },
    { name: 'Hamburguesa BBQ', description: 'Carne de res, queso cheddar, aros de cebolla y salsa BBQ', price: 109, categoryId: hamburguesas.id },
    { name: 'Refresco', description: 'Coca-Cola, Sprite o Fanta (500ml)', price: 25, categoryId: bebidas.id },
    { name: 'Agua Natural', description: 'Botella 600ml', price: 15, categoryId: bebidas.id },
    { name: 'Papas Fritas', description: 'Porción grande de papas fritas crujientes', price: 45, categoryId: null },
  ]

  for (const product of products) {
    const prodId = `prod-${product.name.toLowerCase().replace(/\s/g, '-')}`
    await prisma.product.upsert({
      where: { id: prodId },
      update: { categoryId: product.categoryId },
      create: {
        id: prodId,
        name: product.name,
        description: product.description,
        price: product.price,
        storeId: store.id,
        categoryId: product.categoryId,
        isAvailable: true,
      },
    })
  }
  console.log('✅ Inhouse products created')

  // 15. Repartidores Inhouse
  const driverPassword = await hash('driver123', 12)
  const driver = await prisma.user.upsert({
    where: { email: 'driver@inhouse.com' },
    update: { password: driverPassword, role: 'DRIVER', zoneId: zoneEcuador.id, createdByAdminId: admin.id },
    create: {
      name: 'Juan Pérez (Transportista)',
      email: 'driver@inhouse.com',
      password: driverPassword,
      role: 'DRIVER',
      phone: '0979876543',
      zoneId: zoneEcuador.id,
      createdByAdminId: admin.id,
    },
  })
  console.log('✅ Driver 1 In-House created:', driver.email)

  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@ecufletes.com' },
    update: { password: driverPassword, role: 'DRIVER', zoneId: zoneEcuador.id, createdByAdminId: admin.id },
    create: {
      name: 'Carlos Mendoza (Transportista Autónomo)',
      email: 'driver2@ecufletes.com',
      password: driverPassword,
      role: 'DRIVER',
      phone: '0961122334',
      zoneId: zoneEcuador.id,
      createdByAdminId: admin.id,
    },
  })
  console.log('✅ Driver 2 In-House created:', driver2.email)


  // 16. Inicializar contador global de pedidos
  await prisma.counter.upsert({
    where: { id: 'order_counter' },
    update: {},
    create: { id: 'order_counter', value: 1000 },
  })
  console.log('✅ Order counter initialized')

  console.log('\n🎉 Seeding completed successfully!')
  console.log('====================================================')
  console.log('👑 Super Admin: lveliz213@hotmail.com / 20021985FreeS@IN-HOUSE')
  console.log('🛡️  Admin Demo:  admin@demo.com / Admin2024! (Zona Demo - Centro)')
  console.log('🏪 Vendor Demo: vendor@demo.com / Vendor2024!')
  console.log('🚚 Driver Demo: driver@demo.com / Driver2024!')
  console.log('----------------------------------------------------')
  console.log('🛡️  Admin Inhouse: admin@inhouse.com / admin123 (Ecuador Nacional)')
  console.log('🏪 Vendor Inhouse: vendor@inhouse.com / vendor123')
  console.log('🚚 Driver Inhouse: driver@inhouse.com / driver123')
  console.log('====================================================')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
