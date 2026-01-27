import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/products/[id] - Actualizar producto
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Obtener sesión para validar autorización
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)

    // Obtener el producto para verificar autorización
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true, zoneId: true } } },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Si es vendedor, solo puede editar productos de sus tiendas
    if (session?.user?.role === 'VENDOR' && session.user.id) {
      if (existingProduct.store.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Si es admin, solo puede editar productos de tiendas en su zona
    if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      if (existingProduct.store.zoneId !== session.user.zoneId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: body,
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

    // Obtener sesión para validar autorización
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)

    // Obtener el producto para verificar autorización
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true, zoneId: true } } },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Si es vendedor, solo puede eliminar productos de sus tiendas
    if (session?.user?.role === 'VENDOR' && session.user.id) {
      if (existingProduct.store.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Si es admin, solo puede eliminar productos de tiendas en su zona
    if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      if (existingProduct.store.zoneId !== session.user.zoneId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
