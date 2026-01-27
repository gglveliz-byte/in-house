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

    // Obtener estadísticas adicionales para cada admin
    const adminsWithStats = await Promise.all(
      admins.map(async (admin) => {
        // Obtener tiendas de la zona del admin
        const stores = admin.zone ? await prisma.store.findMany({
          where: { zoneId: admin.zone.id },
          select: { id: true },
        }) : []
        
        const storeIds = stores.map(s => s.id)

        // Contar pedidos y calcular ingresos
        const orders = storeIds.length > 0 ? await prisma.order.findMany({
          where: { storeId: { in: storeIds } },
          select: {
            status: true,
            actualDeliveryFee: true,
          },
        }) : []

        const completedOrders = orders.filter(o => o.status === 'DELIVERED').length
        const totalDeliveryRevenue = orders
          .filter(o => o.status === 'DELIVERED')
          .reduce((sum, o) => sum + (o.actualDeliveryFee || 0), 0)

        // Contar repartidores asignados a la zona del admin
        const driversCount = admin.zone ? await prisma.user.count({
          where: {
            role: 'DRIVER',
            zoneId: admin.zone.id,
          },
        }) : 0

        return {
          ...admin,
          _count: {
            stores: storeIds.length,
          },
          stats: {
            totalOrders: orders.length,
            completedOrders,
            totalDeliveryRevenue,
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
