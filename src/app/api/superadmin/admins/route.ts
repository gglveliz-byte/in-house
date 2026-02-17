import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// GET /api/superadmin/admins - Obtener todos los admins
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        superAdminId: session.user.id,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        registeredAt: true,
        createdAt: true,
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            stores: true,
          },
        },
      },
    })

    const adminsWithStats = await Promise.all(
      admins.map(async (admin) => {
        if (!admin.zone) {
          return {
            ...admin,
            _count: { stores: 0 },
            stats: { totalOrders: 0, completedOrders: 0, totalDeliveryRevenue: 0, totalDrivers: 0 },
          }
        }

        const zoneId = admin.zone.id

        const [storeCount, orderCount, completedCount, revenueAgg, driversCount] = await Promise.all([
          prisma.store.count({ where: { zoneId } }),
          prisma.order.count({ where: { store: { zoneId } } }),
          prisma.order.count({ where: { store: { zoneId }, status: 'DELIVERED' } }),
          prisma.order.aggregate({
            where: { store: { zoneId }, status: 'DELIVERED' },
            _sum: { actualDeliveryFee: true },
          }),
          prisma.user.count({ where: { role: 'DRIVER', zoneId } }),
        ])

        return {
          ...admin,
          _count: { stores: storeCount },
          stats: {
            totalOrders: orderCount,
            completedOrders: completedCount,
            totalDeliveryRevenue: revenueAgg._sum.actualDeliveryFee || 0,
            totalDrivers: driversCount,
          },
        }
      })
    )

    return NextResponse.json(adminsWithStats)
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json({ error: 'Error al obtener admins' }, { status: 500 })
  }
}

// POST /api/superadmin/admins - Crear nuevo admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, phone, zoneId } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await hash(password, 12)

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'ADMIN',
        zoneId,
        superAdminId: session.user.id,
        registeredAt: new Date(), // Fecha de registro para facturación
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        registeredAt: true,
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(admin, { status: 201 })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ error: 'Error al crear admin' }, { status: 500 })
  }
}
