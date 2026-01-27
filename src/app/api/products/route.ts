import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products?storeId=xxx - Obtener productos de una tienda
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: 'storeId es requerido' }, { status: 400 })
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
