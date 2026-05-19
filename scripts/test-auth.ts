import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

async function testAuth() {
  const testUsers = [
    { email: 'vendor@demo.com', password: 'Vendor2024!' },
    { email: 'driver@demo.com', password: 'Driver2024!' },
    { email: 'lveliz213@hotmail.com', password: '20021985FreeS@IN-HOUSE' }
  ]

  for (const u of testUsers) {
    const dbUser = await prisma.user.findUnique({
      where: { email: u.email }
    })

    if (!dbUser) {
      console.log(`❌ User ${u.email} not found in database!`)
      continue
    }

    const matches = await compare(u.password, dbUser.password)
    console.log(`User: ${u.email}`)
    console.log(`  Role: ${dbUser.role}`)
    console.log(`  Password matches input '${u.password}': ${matches ? '✅ YES' : '❌ NO'}`)
  }

  await prisma.$disconnect()
}

testAuth()
