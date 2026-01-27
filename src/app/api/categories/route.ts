import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/categories - Crear categoría
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, storeId, order } = body

    const category = await prisma.category.create({
      data: {
        name,
        storeId,
        order: order || 0,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 })
  }
}
