import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stores/[slug] - Obtener tienda por slug o ID con productos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Intentar buscar por slug primero, luego por ID
    let store = await prisma.store.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            products: {
              where: { isAvailable: true },
              orderBy: { name: 'asc' },
            },
          },
        },
        products: {
          where: {
            isAvailable: true,
            categoryId: null,
          },
          orderBy: { name: 'asc' },
        },
        zone: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            currency: true,
          },
        },
      },
    })

    // Si no se encuentra por slug, intentar por ID
    if (!store) {
      const storeById = await prisma.store.findUnique({
        where: { id: slug },
        include: {
          categories: {
            orderBy: { order: 'asc' },
            include: {
              products: {
                where: { isAvailable: true },
                orderBy: { name: 'asc' },
              },
            },
          },
          products: {
            where: {
              isAvailable: true,
              categoryId: null,
            },
            orderBy: { name: 'asc' },
          },
          zone: {
            select: {
              id: true,
              name: true,
              latitude: true,
              longitude: true,
              currency: true,
            },
          },
        },
      })
      store = storeById
    }

    if (!store) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
    }

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error fetching store:', error)
    return NextResponse.json({ error: 'Error al obtener tienda' }, { status: 500 })
  }
}

// PATCH /api/stores/[slug] - Actualizar tienda
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const existingStore = await prisma.store.findUnique({
      where: { slug },
      select: { zoneId: true, ownerId: true },
    })
    
    if (!existingStore) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
    }
    
    // Si es admin, solo puede editar tiendas de su zona
    if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      if (existingStore.zoneId !== session.user.zoneId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }
    
    // Si es vendedor, solo puede editar sus propias tiendas
    if (session?.user?.role === 'VENDOR') {
      if (existingStore.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Preparar datos de actualización, asegurando que logo y banner se guarden por separado
    const updateData: Record<string, unknown> = {}
    
    // Campos permitidos para actualizar
    const allowedFields = [
      'name', 'slug', 'description', 'whatsapp', 'address', 
      'latitude', 'longitude', 'isOpen', 'minOrder', 
      'deliveryFee', 'minDeliveryFee', 'maxDeliveryFee', 
      'paymentMethods', 'logo', 'banner'
    ]
    
    for (const field of allowedFields) {
      if (field in body) {
        // Asegurar que logo y banner se guarden por separado
        if (field === 'logo' || field === 'banner') {
          updateData[field] = body[field] || null
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const store = await prisma.store.update({
      where: { slug },
      data: updateData,
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error updating store:', error)
    return NextResponse.json({ error: 'Error al actualizar tienda' }, { status: 500 })
  }
}
