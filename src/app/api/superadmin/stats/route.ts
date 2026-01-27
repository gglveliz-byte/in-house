import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Función para calcular el monto a cobrar según el modelo de precios
function calculateAmountDue(completedOrders: number): number {
  // 0-30 pedidos: $10 (fijo)
  // Cada 20 pedidos adicionales: +$10
  // Máximo $100 hasta 300 pedidos
  // Después de 1000: reinicia en $110
  
  if (completedOrders <= 0) return 10
  
  // Ciclo base (0-1000)
  const cycleBase = Math.floor(completedOrders / 1000)
  const ordersInCycle = completedOrders % 1000 || (completedOrders >= 1000 ? 1000 : 0)
  
  let amount = 10 + (cycleBase * 10) // Base aumenta $10 cada 1000 pedidos
  
  if (ordersInCycle <= 30) {
    // Primeros 30 pedidos: $10 base
    return amount
  }
  
  // Calcular incrementos de $10 cada 20 pedidos después de los primeros 30
  const additionalOrders = ordersInCycle - 30
  const increments = Math.ceil(additionalOrders / 20)
  amount += increments * 10
  
  // Máximo $100 por ciclo base (antes de 1000 pedidos)
  const maxForCycle = 100 + (cycleBase * 10)
  return Math.min(amount, maxForCycle)
}

// GET /api/superadmin/stats - Obtener estadísticas del dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Contar totales
    const [totalAdmins, totalZones, totalStores] = await Promise.all([
      prisma.user.count({
        where: { role: 'ADMIN', superAdminId: session.user.id },
      }),
      prisma.zone.count({ where: { isActive: true } }),
      prisma.store.count(),
    ])

    // Obtener todos los admins con sus estadísticas
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        superAdminId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        registeredAt: true,
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calcular estadísticas por admin
    let totalOrders = 0
    let totalRevenue = 0
    let pendingBilling = 0

    const adminsWithStats = await Promise.all(
      admins.map(async (admin) => {
        // Obtener tiendas de la zona del admin
        const stores = admin.zone ? await prisma.store.findMany({
          where: { zoneId: admin.zone.id },
          select: { id: true },
        }) : []
        
        const storeIds = stores.map(s => s.id)

        // Obtener pedidos
        const orders = storeIds.length > 0 ? await prisma.order.findMany({
          where: { storeId: { in: storeIds } },
          select: {
            status: true,
            actualDeliveryFee: true,
          },
        }) : []

        const completedOrders = orders.filter(o => o.status === 'DELIVERED').length
        const deliveryRevenue = orders
          .filter(o => o.status === 'DELIVERED')
          .reduce((sum, o) => sum + (o.actualDeliveryFee || 0), 0)

        // Contar tiendas y repartidores
        const driversCount = admin.zone ? await prisma.user.count({
          where: {
            role: 'DRIVER',
            deliveries: {
              some: {
                store: {
                  zoneId: admin.zone.id,
                },
              },
            },
          },
        }) : 0

        // Calcular monto a cobrar
        const amountDue = calculateAmountDue(completedOrders)

        // Verificar estado de facturación (simplificado)
        const billingStatus = 'PENDING_PAYMENT' // Por ahora todos pendientes

        totalOrders += orders.length
        totalRevenue += deliveryRevenue
        pendingBilling += amountDue

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          zoneName: admin.zone?.name || null,
          registeredAt: admin.registeredAt,
          totalStores: storeIds.length,
          totalDrivers: driversCount,
          totalOrders: orders.length,
          completedOrders,
          totalDeliveryRevenue: deliveryRevenue,
          amountDue,
          billingStatus,
        }
      })
    )

    return NextResponse.json({
      totalAdmins,
      totalZones,
      totalStores,
      totalOrders,
      totalRevenue,
      pendingBilling,
      admins: adminsWithStats,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
