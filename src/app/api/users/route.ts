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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    // Obtener sesión para filtrar por zona si es admin
    const session = await getServerSession(authOptions)

    // Construir filtro
    const where: Record<string, unknown> = {}
    if (role) where.role = role
    
    // Si es admin, solo ver usuarios de su zona filtrados por rol si se pide
    if (session?.user?.role === 'ADMIN' && session.user.id) {
      const orConditions = []

      if (!role || role === 'VENDOR') {
        orConditions.push({
          role: 'VENDOR',
          OR: [
            { createdByAdminId: session.user.id },
            { stores: { some: { zoneId: session.user.zoneId } } },
          ],
        })
      }
      if (!role || role === 'DRIVER') {
        orConditions.push({
          role: 'DRIVER',
          OR: [
            { createdByAdminId: session.user.id },
            { zoneId: session.user.zoneId },
          ],
        })
      }

      if (orConditions.length > 0) {
        where.OR = orConditions
      }
      delete where.role
    }

    const userSelect = {
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
    }

    if (searchParams.has('page') || searchParams.has('limit')) {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
          select: userSelect,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({
          where: Object.keys(where).length > 0 ? where : undefined,
        }),
      ])

      return NextResponse.json({
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } else {
      const users = await prisma.user.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(users)
    }
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

    // Si es admin creando un usuario, asignar su zona y rastrear quién lo creó
    let zoneId: string | null = null
    let createdByAdminId: string | null = null
    
    if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      // Si es repartidor, asignar zona directamente
      if (role === 'DRIVER') {
        zoneId = session.user.zoneId
      }
      // Rastrear que este admin creó este usuario (vendedor o repartidor)
      createdByAdminId = session.user.id
    } else {
      // Si no es admin, usar zoneId del body si viene
      zoneId = body.zoneId || null
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'VENDOR',
        phone,
        zoneId,
        createdByAdminId,
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
