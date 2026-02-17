import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/stores - Obtener todas las tiendas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const onlyOpen = searchParams.get('onlyOpen') === 'true'
    const zoneId = searchParams.get('zoneId')

    // Obtener sesión para filtrar por zona si es admin
    const session = await getServerSession(authOptions)

    // Construir filtro dinámico
    const where: Record<string, unknown> = {}
    if (onlyOpen) where.isOpen = true
    
    // Si es un admin, solo ver tiendas de su zona
    if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      where.zoneId = session.user.zoneId
    } else if (zoneId) {
      // Si se especifica zoneId en query (para clientes)
      where.zoneId = zoneId
    }

    const stores = await prisma.store.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        banner: true,
        whatsapp: true,
        address: true,
        latitude: true,
        longitude: true,
        isOpen: true,
        minOrder: true,
        deliveryFee: true,
        minDeliveryFee: true,
        maxDeliveryFee: true,
        zoneId: true,
        zone: { select: { currency: true } },
        ownerId: true,
        ...(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'
          ? {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            }
          : {
              owner: {
                select: {
                  id: true,
                  name: true,
                },
              },
            }),
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(stores)
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json({ error: 'Error al obtener tiendas' }, { status: 500 })
  }
}

// POST /api/stores - Crear nueva tienda (solo admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug: providedSlug, description, logo, banner, whatsapp, address, latitude, longitude, ownerId, minOrder, deliveryFee } = body

    // Obtener sesión para asignar zona automáticamente si es admin
    const session = await getServerSession(authOptions)
    
    // Generar slug único si no se proporciona
    const baseSlug = providedSlug || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    let slug = baseSlug
    let counter = 1
    while (await prisma.store.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Determinar zona: si es admin, usar su zona; si no, usar la del body
    const zoneId = session?.user?.role === 'ADMIN' && session.user.zoneId 
      ? session.user.zoneId 
      : body.zoneId || null

    const store = await prisma.store.create({
      data: {
        name,
        slug,
        description,
        logo,
        banner,
        whatsapp,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ownerId,
        minOrder: minOrder || 0,
        deliveryFee: deliveryFee || 0,
        minDeliveryFee: body.minDeliveryFee ? parseFloat(body.minDeliveryFee) : 0,
        maxDeliveryFee: body.maxDeliveryFee ? parseFloat(body.maxDeliveryFee) : 0,
        zoneId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    console.error('Error creating store:', error)
    return NextResponse.json({ error: 'Error al crear tienda' }, { status: 500 })
  }
}
