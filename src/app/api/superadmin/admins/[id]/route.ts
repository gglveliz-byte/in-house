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

    // Verificar que el admin pertenece a este Super Admin
    const existingAdmin = await prisma.user.findUnique({
      where: { id },
      select: { superAdminId: true, role: true },
    })

    if (!existingAdmin || existingAdmin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 })
    }

    if (existingAdmin.superAdminId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

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
