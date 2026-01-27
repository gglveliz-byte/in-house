import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users - Obtener todos los usuarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    // Obtener sesión para filtrar por zona si es admin
    const session = await getServerSession(authOptions)

    // Construir filtro
    const where: Record<string, unknown> = {}
    if (role) where.role = role
    
    // Si es admin, solo ver usuarios que tienen tiendas en su zona
    // O usuarios que él mismo ha creado (zoneId = su zona)
    if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      // Filtrar: vendedores que tienen tiendas en la zona del admin
      // O repartidores que tienen la misma zona
      where.OR = [
        {
          // Vendedores con tiendas en la zona del admin
          role: 'VENDOR',
          stores: {
            some: {
              zoneId: session.user.zoneId
            }
          }
        },
        {
          // Repartidores asignados a la zona del admin
          role: 'DRIVER',
          zoneId: session.user.zoneId
        }
      ]
      // No filtrar por role si ya estamos filtrando con OR
      delete where.role
    }

    const users = await prisma.user.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        zoneId: true,
        stores: {
          select: {
            id: true,
            name: true,
            slug: true,
            zoneId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

// POST /api/users - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, phone } = body

    // Obtener sesión para asignar zona si es admin creando un repartidor
    const session = await getServerSession(authOptions)

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
    }

    // Hash de la contraseña
    const hashedPassword = await hash(password, 12)

    // Si es admin creando un repartidor, asignar su zona
    const zoneId = (session?.user?.role === 'ADMIN' && session.user.zoneId && role === 'DRIVER')
      ? session.user.zoneId
      : body.zoneId || null

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'VENDOR',
        phone,
        zoneId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        zoneId: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
