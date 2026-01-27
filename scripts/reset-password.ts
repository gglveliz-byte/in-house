import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

// Crear interfaz para leer desde la consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
    },
  })

  console.log('\n📋 USUARIOS DISPONIBLES:\n')
  console.log('='.repeat(80))
  users.forEach((user, index) => {
    const roleEmoji = user.role === 'SUPER_ADMIN' ? '👑' : 
                     user.role === 'ADMIN' ? '🛡️' : 
                     user.role === 'VENDOR' ? '🏪' : '🚚'
    console.log(`${index + 1}. ${roleEmoji} ${user.name.padEnd(30)} ${user.email.padEnd(35)} (${user.role})`)
  })
  console.log('='.repeat(80))
  console.log()

  return users
}

async function resetPassword() {
  try {
    console.log('🔐 RESETEAR CONTRASEÑA DE USUARIO\n')

    // Listar usuarios
    const users = await listUsers()

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos.')
      return
    }

    // Seleccionar usuario
    let selectedUser = null
    let attempts = 0
    const maxAttempts = 3

    while (!selectedUser && attempts < maxAttempts) {
      const input = await question('\n👉 Ingresa el número del usuario o el email: ')

      // Intentar por número
      const number = parseInt(input.trim())
      if (!isNaN(number) && number >= 1 && number <= users.length) {
        selectedUser = users[number - 1]
        break
      }

      // Intentar por email
      const userByEmail = users.find(u => u.email.toLowerCase() === input.trim().toLowerCase())
      if (userByEmail) {
        selectedUser = userByEmail
        break
      }

      attempts++
      if (attempts < maxAttempts) {
        console.log(`❌ Usuario no encontrado. Intento ${attempts}/${maxAttempts}`)
      } else {
        console.log('❌ Máximo de intentos alcanzado.')
        return
      }
    }

    if (!selectedUser) {
      console.log('❌ No se pudo seleccionar el usuario.')
      return
    }

    // Mostrar información del usuario seleccionado
    console.log('\n✅ Usuario seleccionado:')
    console.log(`   👤 Nombre: ${selectedUser.name}`)
    console.log(`   📧 Email: ${selectedUser.email}`)
    console.log(`   🎭 Rol: ${selectedUser.role}`)
    console.log()

    // Confirmar
    const confirm = await question('¿Deseas continuar con este usuario? (s/n): ')
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Operación cancelada.')
      return
    }

    // Pedir nueva contraseña
    console.log('\n🔑 Ingresa la nueva contraseña:')
    console.log('   (La contraseña debe tener al menos 6 caracteres)')
    const newPassword = await question('   Nueva contraseña: ')

    if (newPassword.length < 6) {
      console.log('❌ La contraseña debe tener al menos 6 caracteres.')
      return
    }

    // Confirmar contraseña
    const confirmPassword = await question('   Confirma la contraseña: ')

    if (newPassword !== confirmPassword) {
      console.log('❌ Las contraseñas no coinciden.')
      return
    }

    // Hash de la contraseña
    console.log('\n⏳ Actualizando contraseña...')
    const hashedPassword = await hash(newPassword, 12)

    // Actualizar en la base de datos
    await prisma.user.update({
      where: { id: selectedUser.id },
      data: { password: hashedPassword },
    })

    console.log('✅ Contraseña actualizada exitosamente!')
    console.log(`\n📧 Usuario: ${selectedUser.email}`)
    console.log(`🔑 Nueva contraseña: ${newPassword}`)
    console.log('\n💡 Guarda esta información de forma segura.')

  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

resetPassword()
