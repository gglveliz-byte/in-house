export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'VENDOR' | 'DRIVER' | 'CUSTOMER'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED'

// Zona geográfica (SaaS multi-tenant)
export interface Zone {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
  createdAt: string
}

export interface Store {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  banner: string | null
  whatsapp: string
  address: string
  latitude: number | null
  longitude: number | null
  isOpen: boolean
  minOrder: number
  deliveryFee: number
  minDeliveryFee: number
  maxDeliveryFee: number
  paymentMethods: string | null
  businessHours: string | null
  zoneId: string | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  isAvailable: boolean
  storeId: string
  categoryId: string | null
}

export interface Category {
  id: string
  name: string
  order: number
  storeId: string
  products?: Product[]
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
}

export type PaymentStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED'
export type DeliveryPaymentStatus = 'PENDING' | 'PAID_CASH' | 'PAID_TRANSFER'

export interface Order {
  id: string
  orderNumber: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentProof: string | null
  deliveryPaymentStatus: DeliveryPaymentStatus | null
  deliveryPaymentProof: string | null
  customerName: string
  customerPhone: string
  customerAddress: string
  customerLat: number | null
  customerLng: number | null
  customerNotes: string | null
  subtotal: number
  deliveryFee: number
  actualDeliveryFee: number | null
  total: number
  createdAt: string
  confirmedAt: string | null
  readyAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  storeId: string
  driverId: string | null
  items: OrderItem[]
}

export interface Message {
  id: string
  content: string
  imageUrl: string | null
  senderType: 'CUSTOMER' | 'VENDOR' | 'DRIVER' | 'SYSTEM'
  senderName: string
  isRead: boolean
  createdAt: string
  orderId: string
}

export interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes: string | null
  productId: string
  product: Product
}

// Usuario del sistema
export interface User {
  id: string
  email: string
  name: string
  role: Role
  phone: string | null
  createdAt: string
  registeredAt: string | null
  zoneId: string | null
  zone?: Zone
  superAdminId: string | null
}

// Ciclo de facturación mensual
export type BillingStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'PAID' | 'OVERDUE'

export interface BillingCycle {
  id: string
  startDate: string
  endDate: string
  totalOrders: number
  totalDeliveryRevenue: number
  amountDue: number
  isPaid: boolean
  paidAt: string | null
  paymentProof: string | null
  status: BillingStatus
  adminId: string
  admin?: User
}

// Mensajes entre Super Admin y Admin
export type MessageType = 'GENERAL' | 'BILLING' | 'SUPPORT' | 'ANNOUNCEMENT'

export interface AdminMessage {
  id: string
  content: string
  imageUrl: string | null
  messageType: MessageType
  isRead: boolean
  createdAt: string
  senderId: string
  sender?: User
  receiverId: string
  receiver?: User
  billingCycleId: string | null
}

// Notificaciones (campanita)
export type NotificationType = 'INFO' | 'BILLING' | 'ORDER' | 'SYSTEM' | 'WARNING'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  link: string | null
  createdAt: string
  userId: string
}

// Estadísticas de Admin (para Super Admin)
export interface AdminStats {
  admin: User
  zone: Zone
  totalOrders: number
  completedOrders: number
  totalDeliveryRevenue: number
  totalStores: number
  totalDrivers: number
  currentBillingCycle: BillingCycle | null
  amountDue: number
}
