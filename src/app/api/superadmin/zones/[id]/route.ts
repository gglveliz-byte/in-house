import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/superadmin/zones/[id] - Actualizar zona
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const allowedFields = ['name', 'description', 'latitude', 'longitude', 'radius', 'currency', 'isActive']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const zone = await prisma.zone.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error updating zone:', error)
    return NextResponse.json({ error: 'Error al actualizar zona' }, { status: 500 })
  }
}

// DELETE /api/superadmin/zones/[id] - Eliminar zona
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    await prisma.zone.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Zona eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting zone:', error)
    return NextResponse.json({ error: 'Error al eliminar zona' }, { status: 500 })
  }
}
