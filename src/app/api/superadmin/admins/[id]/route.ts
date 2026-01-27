import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// PATCH /api/superadmin/admins/[id] - Actualizar admin
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

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {}
    
    if (body.name) updateData.name = body.name
    if (body.email) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.zoneId !== undefined) updateData.zoneId = body.zoneId
    
    // Si se proporciona nueva contraseña, hashearla
    if (body.password) {
      updateData.password = await hash(body.password, 12)
    }

    const admin = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json({ error: 'Error al actualizar admin' }, { status: 500 })
  }
}

// DELETE /api/superadmin/admins/[id] - Eliminar admin
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

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json({ error: 'Error al eliminar admin' }, { status: 500 })
  }
}
