import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'

export async function GET() {
  const auditLogs: Array<{ step: string; message: string; type: 'SUCCESS' | 'INFO' | 'ERROR' }> = []
  const tempDrivers: User[] = []
  let testOrderId: string | null = null

  const log = (step: string, message: string, type: 'SUCCESS' | 'INFO' | 'ERROR' = 'SUCCESS') => {
    auditLogs.push({ step, message, type })
  }

  try {
    log('INICIO', 'Iniciando simulación de estrés y alta concurrencia...', 'INFO')

    // 1. Obtener una tienda y zona demo
    const store = await prisma.store.findFirst()
    if (!store) {
      log('DATABASE', 'No se encontró ninguna tienda en la base de datos para la prueba.', 'ERROR')
      return NextResponse.json({ success: false, logs: auditLogs }, { status: 500 })
    }

    log('DATABASE', `Usando tienda "${store.name}" y zona "${store.zoneId}" para el test.`, 'INFO')

    // 2. Obtener o crear 5 conductores válidos para satisfacer las claves foráneas de Postgres
    const dbDrivers = await prisma.user.findMany({
      where: { role: 'DRIVER', zoneId: store.zoneId },
      take: 5
    })

    log('DATABASE', `Encontrados ${dbDrivers.length} conductores pre-existentes en la zona.`, 'INFO')

    // Si hay menos de 5, creamos conductores temporales
    if (dbDrivers.length < 5) {
      const needed = 5 - dbDrivers.length
      log('SETUP', `Creando ${needed} conductores temporales válidos para satisfacer restricciones de integridad de Postgres...`, 'INFO')
      for (let i = 0; i < needed; i++) {
        const rand = Math.floor(Math.random() * 100000)
        const driver = await prisma.user.create({
          data: {
            email: `temp-driver-${rand}-${i}@testconcurrency.com`,
            password: 'hashed-concurrency-password',
            name: `Repartidor Concurrente ${i + 1}`,
            role: 'DRIVER',
            zoneId: store.zoneId
          }
        })
        tempDrivers.push(driver)
      }
    }

    const allTestDrivers = [...dbDrivers, ...tempDrivers].slice(0, 5)
    log('SETUP', `Listo. Compitiendo con ${allTestDrivers.length} conductores válidos: ${allTestDrivers.map(d => d.name).join(', ')}.`, 'SUCCESS')

    // 3. Crear un pedido temporal listo para ser reclamado
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: 88888,
        status: 'READY',
        customerName: 'Test de Concurrencia',
        customerPhone: '0999999999',
        customerAddress: 'Av. Colón y 10 de Agosto, Quito',
        subtotal: 15.0,
        deliveryFee: 3.5,
        total: 18.5,
        storeId: store.id,
        zoneId: store.zoneId,
      }
    })
    testOrderId = testOrder.id

    log('SETUP', `Pedido temporal #${testOrder.orderNumber} creado en estado LISTO (driverId = null).`, 'SUCCESS')

    // 4. Simular los 5 conductores compitiendo en el mismo milisegundo
    log('CONCURRENCY', `Disparando ${allTestDrivers.length} peticiones de asignación simultáneas (Promise.all)...`, 'INFO')

    const startTime = Date.now()
    const results = await Promise.allSettled(
      allTestDrivers.map(async (driver) => {
        // Lógica de Bloqueo Optimista: Solo actualiza si driverId es null
        const updateResult = await prisma.order.updateMany({
          where: {
            id: testOrder.id,
            driverId: null, // Condición atómica clave
          },
          data: {
            driverId: driver.id,
            status: 'PICKED_UP',
            pickedUpAt: new Date(),
          }
        })

        if (updateResult.count === 0) {
          throw new Error(`ALREADY_CLAIMED: El pedido ya fue tomado.`)
        }
        return driver
      })
    )
    const duration = Date.now() - startTime

    log('CONCURRENCY', `Procesamiento paralelo finalizado en ${duration}ms.`, 'INFO')

    // 5. Analizar resultados de la simulación
    const successfulClaims = results.filter(r => r.status === 'fulfilled')
    const failedClaims = results.filter(r => r.status === 'rejected')

    const hasExactOneSuccess = successfulClaims.length === 1
    const hasExactFourFailures = failedClaims.length === 4

    log('ANÁLISIS', `Conductores exitosos: ${successfulClaims.length} (Esperado: 1)`, hasExactOneSuccess ? 'SUCCESS' : 'ERROR')
    log('ANÁLISIS', `Conductores rechazados: ${failedClaims.length} (Esperado: 4)`, hasExactFourFailures ? 'SUCCESS' : 'ERROR')

    // Logear el detalle de cada competidor
    results.forEach((res, index) => {
      const driver = allTestDrivers[index]
      if (res.status === 'fulfilled') {
        log('RESULTADO', `🟢 Conductor "${driver.name}" (${driver.id}) ASIGNADO exitosamente.`, 'SUCCESS')
      } else {
        const errorMsg = (res as PromiseRejectedResult).reason.message
        log('RESULTADO', `🔴 Conductor "${driver.name}" (${driver.id}) RECHAZADO: ${errorMsg}`, 'ERROR')
      }
    })

    // 6. Verificar consistencia en la base de datos final
    const finalOrderState = await prisma.order.findUnique({
      where: { id: testOrder.id },
      select: { driverId: true, status: true }
    })

    const isConsistent = finalOrderState && 
      finalOrderState.driverId !== null && 
      allTestDrivers.some(d => d.id === finalOrderState.driverId) &&
      finalOrderState.status === 'PICKED_UP'

    log('CONSISTENCIA', `Estado de pedido en DB: driverId = "${finalOrderState?.driverId}", status = "${finalOrderState?.status}".`, isConsistent ? 'SUCCESS' : 'ERROR')
    log('CONSISTENCIA', isConsistent 
      ? '¡Prueba superada con éxito! La consistencia de la base de datos es del 100% y se evitaron duplicaciones.' 
      : 'Fallo de consistencia detectado en la asignación.', 
      isConsistent ? 'SUCCESS' : 'ERROR'
    )

    // 7. Limpieza: Eliminar el pedido de prueba
    if (testOrderId) {
      await prisma.order.delete({
        where: { id: testOrderId }
      })
      log('CLEANUP', 'Pedido temporal eliminado de la base de datos.', 'INFO')
    }

    // Limpieza: Eliminar conductores temporales creados
    if (tempDrivers.length > 0) {
      const tempDriverIds = tempDrivers.map(d => d.id)
      await prisma.user.deleteMany({
        where: { id: { in: tempDriverIds } }
      })
      log('CLEANUP', `${tempDrivers.length} conductores temporales eliminados de la base de datos.`, 'INFO')
    }

    return NextResponse.json({
      success: isConsistent && hasExactOneSuccess && hasExactFourFailures,
      durationMs: duration,
      logs: auditLogs,
      metrics: {
        totalDrivers: allTestDrivers.length,
        successful: successfulClaims.length,
        failed: failedClaims.length,
        assignedDriverId: finalOrderState?.driverId
      }
    })

  } catch (error) {
    const err = error as Error
    log('ERROR_CRÍTICO', `Fallo en el script de prueba: ${err.message}`, 'ERROR')
    
    // Garantizar limpieza en caso de error
    if (testOrderId) {
      await prisma.order.delete({ where: { id: testOrderId } }).catch(() => {})
    }
    if (tempDrivers.length > 0) {
      const tempDriverIds = tempDrivers.map(d => d.id)
      await prisma.user.deleteMany({ where: { id: { in: tempDriverIds } } }).catch(() => {})
    }

    return NextResponse.json({ success: false, logs: auditLogs }, { status: 500 })
  }
}
