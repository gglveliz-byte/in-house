import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// DELETE /api/superadmin/admins/[id] - Eliminar admin y TODOS sus datos
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el admin pertenece a este Super Admin
    const admin = await prisma.user.findUnique({
      where: { id },
      select: { superAdminId: true, role: true, zoneId: true },
    })

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 })
    }

    if (admin.superAdminId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Eliminar todo en una transacción (timeout extendido por la cantidad de operaciones)
    await prisma.$transaction(async (tx) => {
      // 1. Obtener IDs de tiendas en la zona del admin
      const storeIds = admin.zoneId
        ? (await tx.store.findMany({
            where: { zoneId: admin.zoneId },
            select: { id: true },
          })).map(s => s.id)
        : []

      // 2. Obtener IDs de pedidos de esas tiendas
      const orderIds = storeIds.length > 0
        ? (await tx.order.findMany({
            where: { storeId: { in: storeIds } },
            select: { id: true },
          })).map(o => o.id)
        : []

      // 3. Eliminar mensajes de chat de los pedidos
      if (orderIds.length > 0) {
        await tx.message.deleteMany({
          where: { orderId: { in: orderIds } },
        })
      }

      // 4. Eliminar items de los pedidos
      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { orderId: { in: orderIds } },
        })
      }

      // 5. Eliminar pedidos
      if (orderIds.length > 0) {
        await tx.order.deleteMany({
          where: { id: { in: orderIds } },
        })
      }

      // 6. Eliminar productos de las tiendas
      if (storeIds.length > 0) {
        await tx.product.deleteMany({
          where: { storeId: { in: storeIds } },
        })
      }

      // 7. Eliminar categorías de las tiendas
      if (storeIds.length > 0) {
        await tx.category.deleteMany({
          where: { storeId: { in: storeIds } },
        })
      }

      // 8. Eliminar tiendas
      if (storeIds.length > 0) {
        await tx.store.deleteMany({
          where: { id: { in: storeIds } },
        })
      }

      // 9. Obtener usuarios creados por este admin (vendors, drivers)
      const createdUserIds = (await tx.user.findMany({
        where: { createdByAdminId: id },
        select: { id: true },
      })).map(u => u.id)

      // 10. Eliminar notificaciones de usuarios creados
      if (createdUserIds.length > 0) {
        await tx.notification.deleteMany({
          where: { userId: { in: createdUserIds } },
        })
      }

      // 11. Eliminar password resets de usuarios creados
      if (createdUserIds.length > 0) {
        await tx.passwordReset.deleteMany({
          where: { userId: { in: createdUserIds } },
        })
      }

      // 12. Eliminar usuarios creados por el admin
      if (createdUserIds.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: createdUserIds } },
        })
      }

      // 13. Eliminar mensajes admin (enviados y recibidos)
      await tx.adminMessage.deleteMany({
        where: {
          OR: [
            { senderId: id },
            { receiverId: id },
          ],
        },
      })

      // 14. Eliminar ciclos de facturación del admin
      await tx.billingCycle.deleteMany({
        where: { adminId: id },
      })

      // 15. Eliminar notificaciones del admin
      await tx.notification.deleteMany({
        where: { userId: id },
      })

      // 16. Eliminar password resets del admin
      await tx.passwordReset.deleteMany({
        where: { userId: id },
      })

      // 17. Eliminar la zona del admin (si existe y no tiene otros admins)
      if (admin.zoneId) {
        const otherAdminsInZone = await tx.user.count({
          where: {
            zoneId: admin.zoneId,
            role: 'ADMIN',
            id: { not: id },
          },
        })
        if (otherAdminsInZone === 0) {
          await tx.zone.delete({
            where: { id: admin.zoneId },
          })
        }
      }

      // 18. Eliminar el admin
      await tx.user.delete({
        where: { id },
      })
    }, { timeout: 30000 })

    return NextResponse.json({ success: true, message: 'Admin y todos sus datos eliminados correctamente' })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json({ error: 'Error al eliminar admin' }, { status: 500 })
  }
}

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
