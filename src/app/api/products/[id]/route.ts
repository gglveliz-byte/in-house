import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/products/[id] - Actualizar producto
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true, zoneId: true } } },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    if (session.user.role === 'VENDOR' && session.user.id) {
      if (existingProduct.store.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    if (session.user.role === 'ADMIN' && session.user.zoneId) {
      if (existingProduct.store.zoneId !== session.user.zoneId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Whitelist de campos permitidos
    const allowedFields = ['name', 'description', 'price', 'image', 'isAvailable', 'categoryId']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    if (updateData.price !== undefined) {
      if (typeof updateData.price !== 'number' || updateData.price < 0) {
        return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true, zoneId: true } } },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    if (session.user.role === 'VENDOR' && session.user.id) {
      if (existingProduct.store.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    if (session.user.role === 'ADMIN' && session.user.zoneId) {
      if (existingProduct.store.zoneId !== session.user.zoneId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
