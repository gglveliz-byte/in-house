import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/users/[id] - Eliminar usuario
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el usuario existe y pertenece a la zona del admin
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        role: true,
        zoneId: true,
        createdByAdminId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Prevenir eliminar SUPER_ADMIN o ADMIN con esta ruta
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'No se puede eliminar un administrador desde esta ruta' },
        { status: 403 }
      )
    }

    // Verificar que el admin que borra tiene permisos sobre este usuario
    if (session.user.role === 'ADMIN') {
      const adminZoneId = session.user.zoneId
      if (
        user.zoneId !== adminZoneId &&
        user.createdByAdminId !== session.user.id
      ) {
        return NextResponse.json(
          { error: 'No tienes permiso para eliminar este usuario' },
          { status: 403 }
        )
      }
    }

    // Eliminar en transacción
    await prisma.$transaction(async (tx) => {
      // Limpiar órdenes activas del driver si es repartidor
      if (user.role === 'DRIVER') {
        await tx.order.updateMany({
          where: { driverId: id, status: { in: ['PICKED_UP', 'CONFIRMED', 'READY'] } },
          data: { driverId: null },
        })
      }

      // Eliminar notificaciones
      await tx.notification.deleteMany({ where: { userId: id } })

      // Eliminar password resets
      await tx.passwordReset.deleteMany({ where: { userId: id } })

      // Eliminar el usuario
      await tx.user.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}

// GET /api/users/[id] - Obtener usuario por ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        zoneId: true,
        createdAt: true,
        stores: {
          select: { id: true, name: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 })
  }
}
