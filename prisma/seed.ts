import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Crear usuario Admin
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@inhouse.com' },
    update: {},
    create: {
      email: 'admin@inhouse.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Crear usuario Vendedor
  const vendorPassword = await hash('vendor123', 12)
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@inhouse.com' },
    update: {},
    create: {
      email: 'vendor@inhouse.com',
      name: 'Juan Vendedor',
      password: vendorPassword,
      role: 'VENDOR',
      phone: '5512345678',
    },
  })
  console.log('✅ Vendor created:', vendor.email)

  // Crear tienda de ejemplo
  const store = await prisma.store.upsert({
    where: { slug: 'hamburguesas-el-rey' },
    update: {},
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
    },
  })
  console.log('✅ Store created:', store.name)

  // Crear categorías
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
  console.log('✅ Categories created')

  // Crear productos de ejemplo
  const products = [
    {
      name: 'Hamburguesa Clásica',
      description: 'Carne de res, lechuga, tomate, cebolla y salsa especial',
      price: 89,
      categoryId: hamburguesas.id,
    },
    {
      name: 'Hamburguesa Doble',
      description: 'Doble carne de res, doble queso, tocino y jalapeños',
      price: 129,
      categoryId: hamburguesas.id,
    },
    {
      name: 'Hamburguesa BBQ',
      description: 'Carne de res, queso cheddar, aros de cebolla y salsa BBQ',
      price: 109,
      categoryId: hamburguesas.id,
    },
    {
      name: 'Refresco',
      description: 'Coca-Cola, Sprite o Fanta (500ml)',
      price: 25,
      categoryId: bebidas.id,
    },
    {
      name: 'Agua Natural',
      description: 'Botella 600ml',
      price: 15,
      categoryId: bebidas.id,
    },
    {
      name: 'Papas Fritas',
      description: 'Porción grande de papas fritas crujientes',
      price: 45,
      categoryId: null,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: `prod-${product.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `prod-${product.name.toLowerCase().replace(/\s/g, '-')}`,
        name: product.name,
        description: product.description,
        price: product.price,
        storeId: store.id,
        categoryId: product.categoryId,
        isAvailable: true,
      },
    })
  }
  console.log('✅ Products created')

  // Crear usuario Repartidor
  const driverPassword = await hash('driver123', 12)
  const driver = await prisma.user.upsert({
    where: { email: 'driver@inhouse.com' },
    update: {},
    create: {
      email: 'driver@inhouse.com',
      name: 'Pedro Repartidor',
      password: driverPassword,
      role: 'DRIVER',
      phone: '5587654321',
    },
  })
  console.log('✅ Driver created:', driver.email)

  // Inicializar contador de pedidos
  await prisma.counter.upsert({
    where: { id: 'order_counter' },
    update: {},
    create: { id: 'order_counter', value: 1000 },
  })
  console.log('✅ Order counter initialized')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Credenciales de prueba:')
  console.log('   Admin:     admin@inhouse.com / admin123')
  console.log('   Vendedor:  vendor@inhouse.com / vendor123')
  console.log('   Repartidor: driver@inhouse.com / driver123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
