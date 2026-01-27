import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/products?storeId=xxx - Obtener productos de una tienda
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 })
    }

    // Obtener sesión para validar autorización si es admin
    const session = await getServerSession(authOptions)

    // Si es admin, verificar que la tienda pertenece a su zona
    if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { zoneId: true },
      })

      if (store && store.zoneId !== session.user.zoneId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const products = await prisma.product.findMany({
      where: {
        storeId,
        isAvailable: true,
      },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

// POST /api/products - Crear producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, image, storeId, categoryId } = body

    // Obtener sesión para validar autorización
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)

    // Si es vendedor, verificar que la tienda le pertenece
    if (session?.user?.role === 'VENDOR' && session.user.id) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { ownerId: true },
      })

      if (!store) {
        return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
      }

      if (store.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        image,
        storeId,
        categoryId,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
