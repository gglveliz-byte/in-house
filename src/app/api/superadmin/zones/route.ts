import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/superadmin/zones - Obtener todas las zonas
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const zones = await prisma.zone.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            admins: true,
            stores: true,
            orders: true,
          },
        },
      },
    })

    return NextResponse.json(zones)
  } catch (error) {
    console.error('Error fetching zones:', error)
    return NextResponse.json({ error: 'Error al obtener zonas' }, { status: 500 })
  }
}

// POST /api/superadmin/zones - Crear nueva zona
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, latitude, longitude, radius, currency } = body

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Nombre, latitud y longitud son requeridos' },
        { status: 400 }
      )
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        description,
        latitude,
        longitude,
        radius: radius || 10,
        currency: currency || 'USD',
      },
    })

    return NextResponse.json(zone, { status: 201 })
  } catch (error) {
    console.error('Error creating zone:', error)
    return NextResponse.json({ error: 'Error al crear zona' }, { status: 500 })
  }
}
