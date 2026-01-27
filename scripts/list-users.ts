import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listUsers() {
  try {
    console.log('🔍 Consultando usuarios en la base de datos...\n')

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        zoneId: true,
        zone: {
          select: {
            name: true,
          },
        },
        superAdminId: true,
        createdByAdminId: true,
        registeredAt: true,
        createdAt: true,
        _count: {
          select: {
            stores: true,
            deliveries: true,
          },
        },
      },
    })

    if (users.length === 0) {
      console.log('❌ No hay usuarios registrados en la base de datos.')
      return
    }

    console.log(`✅ Total de usuarios: ${users.length}\n`)
    console.log('='.repeat(80))
    console.log('📋 LISTA DE USUARIOS REGISTRADOS')
    console.log('='.repeat(80))
    console.log()

    // Agrupar por rol
    const byRole: Record<string, typeof users> = {
      SUPER_ADMIN: [],
      ADMIN: [],
      VENDOR: [],
      DRIVER: [],
    }

    users.forEach(user => {
      const role = user.role || 'VENDOR'
      if (byRole[role]) {
        byRole[role].push(user)
      }
    })

    // Mostrar Super Admins
    if (byRole.SUPER_ADMIN.length > 0) {
      console.log('👑 SUPER ADMINS')
      console.log('-'.repeat(80))
      byRole.SUPER_ADMIN.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`)
        console.log(`   📧 Email: ${user.email}`)
        console.log(`   📞 Teléfono: ${user.phone || 'No registrado'}`)
        console.log(`   🆔 ID: ${user.id}`)
        console.log(`   📅 Creado: ${user.createdAt.toLocaleString('es-ES')}`)
        console.log()
      })
    }

    // Mostrar Admins
    if (byRole.ADMIN.length > 0) {
      console.log('🛡️ ADMINS')
      console.log('-'.repeat(80))
      byRole.ADMIN.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`)
        console.log(`   📧 Email: ${user.email}`)
        console.log(`   📞 Teléfono: ${user.phone || 'No registrado'}`)
        console.log(`   📍 Zona: ${user.zone?.name || 'Sin zona asignada'}`)
        console.log(`   🆔 ID: ${user.id}`)
        console.log(`   📅 Registrado: ${user.registeredAt ? user.registeredAt.toLocaleString('es-ES') : 'No registrado'}`)
        console.log(`   📅 Creado: ${user.createdAt.toLocaleString('es-ES')}`)
        console.log()
      })
    }

    // Mostrar Vendedores
    if (byRole.VENDOR.length > 0) {
      console.log('🏪 VENDEDORES')
      console.log('-'.repeat(80))
      byRole.VENDOR.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`)
        console.log(`   📧 Email: ${user.email}`)
        console.log(`   📞 Teléfono: ${user.phone || 'No registrado'}`)
        console.log(`   🏪 Tiendas: ${user._count.stores}`)
        console.log(`   🆔 ID: ${user.id}`)
        console.log(`   📅 Creado: ${user.createdAt.toLocaleString('es-ES')}`)
        if (user.createdByAdminId) {
          console.log(`   👤 Creado por Admin ID: ${user.createdByAdminId}`)
        }
        console.log()
      })
    }

    // Mostrar Repartidores
    if (byRole.DRIVER.length > 0) {
      console.log('🚚 REPARTIDORES')
      console.log('-'.repeat(80))
      byRole.DRIVER.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`)
        console.log(`   📧 Email: ${user.email}`)
        console.log(`   📞 Teléfono: ${user.phone || 'No registrado'}`)
        console.log(`   📍 Zona: ${user.zone?.name || 'Sin zona asignada'}`)
        console.log(`   📦 Entregas: ${user._count.deliveries}`)
        console.log(`   🆔 ID: ${user.id}`)
        console.log(`   📅 Creado: ${user.createdAt.toLocaleString('es-ES')}`)
        if (user.createdByAdminId) {
          console.log(`   👤 Creado por Admin ID: ${user.createdByAdminId}`)
        }
        console.log()
      })
    }

    // Resumen
    console.log('='.repeat(80))
    console.log('📊 RESUMEN')
    console.log('='.repeat(80))
    console.log(`👑 Super Admins: ${byRole.SUPER_ADMIN.length}`)
    console.log(`🛡️  Admins: ${byRole.ADMIN.length}`)
    console.log(`🏪 Vendedores: ${byRole.VENDOR.length}`)
    console.log(`🚚 Repartidores: ${byRole.DRIVER.length}`)
    console.log(`📦 Total: ${users.length}`)
    console.log()

    // Tabla resumida
    console.log('='.repeat(80))
    console.log('📋 TABLA RESUMIDA')
    console.log('='.repeat(80))
    console.log()
    console.log('ROL'.padEnd(15) + 'NOMBRE'.padEnd(30) + 'EMAIL'.padEnd(35))
    console.log('-'.repeat(80))
    
    users.forEach(user => {
      const role = user.role || 'VENDOR'
      const roleEmoji = role === 'SUPER_ADMIN' ? '👑' : 
                       role === 'ADMIN' ? '🛡️' : 
                       role === 'VENDOR' ? '🏪' : '🚚'
      console.log(`${roleEmoji} ${role.padEnd(12)}${user.name.padEnd(30)}${user.email.padEnd(35)}`)
    })

  } catch (error) {
    console.error('❌ Error al consultar usuarios:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
