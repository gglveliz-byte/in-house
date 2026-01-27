import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'lveliz213@hotmail.com'
  const password = '20021985FreeS@IN-HOUSE'
  const hashedPassword = await bcrypt.hash(password, 10)

  // Verificar si ya existe
  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    // Actualizar a SUPER_ADMIN si ya existe
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'SUPER_ADMIN',
        password: hashedPassword,
      },
    })
    console.log('✅ Usuario actualizado a SUPER_ADMIN:', updated.email)
  } else {
    // Crear nuevo usuario
    const user = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        registeredAt: new Date(),
      },
    })
    console.log('✅ Super Admin creado:', user.email)
  }

  console.log('\n📧 Email:', email)
  console.log('🔑 Contraseña: 20021985FreeS@IN-HOUSE')
  console.log('🌐 Accede en: /login')
  console.log('👑 Panel Super Admin: /superadmin')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
