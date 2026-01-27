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

    const store = await prisma.store.update({
      where: { slug },
      data: body,
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error updating store:', error)
    return NextResponse.json({ error: 'Error al actualizar tienda' }, { status: 500 })
  }
}
