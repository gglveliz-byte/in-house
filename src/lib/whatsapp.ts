import { formatPrice } from './utils'

interface OrderItem {
  quantity: number
  product: {
    name: string
  }
  unitPrice: number
}

interface OrderData {
  orderNumber: number
  customerName: string
  customerAddress: string
  customerNotes?: string | null
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
}

export function generateOrderMessage(order: OrderData): string {
  const itemsList = order.items
    .map((item) => `• ${item.quantity}x ${item.product.name} - ${formatPrice(item.unitPrice * item.quantity)}`)
    .join('\n')

  const message = `
🛒 *NUEVO PEDIDO #${order.orderNumber}*

👤 *Cliente:* ${order.customerName}
📍 *Dirección:* ${order.customerAddress}
${order.customerNotes ? `📝 *Notas:* ${order.customerNotes}` : ''}

*Productos:*
${itemsList}

💰 *Subtotal:* ${formatPrice(order.subtotal)}
🚗 *Envío:* ${formatPrice(order.deliveryFee)}
*TOTAL: ${formatPrice(order.total)}*

---
Responde "OK" para confirmar el pedido.
`.trim()

  return message
}
