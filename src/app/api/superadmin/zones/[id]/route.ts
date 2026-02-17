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
      if (field in body) {
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
