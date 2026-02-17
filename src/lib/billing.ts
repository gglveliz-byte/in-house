/**
 * Calcula el monto a cobrar según el modelo de precios escalonado.
 * 0-30 pedidos: $10 base
 * Cada 20 pedidos adicionales: +$10
 * Máximo $100 por ciclo base
 * Cada 1000 pedidos: nuevo ciclo (+$10 al base)
 */
export function calculateAmountDue(completedOrders: number): number {
  if (completedOrders <= 0) return 10

  const cycleNumber = Math.floor(completedOrders / 1000)
  const ordersInCycle = completedOrders % 1000 || (completedOrders >= 1000 ? 1000 : 0)
  const cycleBase = cycleNumber * 10

  if (ordersInCycle <= 30) {
    return 10 + cycleBase
  }

  const rangesAfter30 = Math.ceil((ordersInCycle - 30) / 20)
  const amount = 10 + rangesAfter30 * 10
  const maxForCycle = 100 + cycleBase

  return Math.min(amount, maxForCycle)
}
