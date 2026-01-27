import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ActiveOrderStatus = 'PENDING' | 'CONFIRMED' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED'

interface ActiveOrder {
  id: string
  orderNumber: number
  status: ActiveOrderStatus
  storeName: string
  total: number
  createdAt: string
}

interface ActiveOrderStore {
  activeOrder: ActiveOrder | null
  
  // Actions
  setActiveOrder: (order: ActiveOrder) => void
  updateStatus: (status: ActiveOrderStatus) => void
  clearActiveOrder: () => void
  
  // Computed
  hasActiveOrder: () => boolean
  isOrderInProgress: () => boolean
}

// Estados que se consideran "en progreso" (no puede hacer otro pedido)
const IN_PROGRESS_STATUSES: ActiveOrderStatus[] = ['PENDING', 'CONFIRMED', 'READY', 'PICKED_UP']

export const useActiveOrderStore = create<ActiveOrderStore>()(
  persist(
    (set, get) => ({
      activeOrder: null,

      setActiveOrder: (order) => {
        set({ activeOrder: order })
      },

      updateStatus: (status) => {
        const { activeOrder } = get()
        if (activeOrder) {
          // Si el pedido terminó (entregado o cancelado), limpiar
          if (status === 'DELIVERED' || status === 'CANCELLED') {
            set({ activeOrder: null })
          } else {
            set({ activeOrder: { ...activeOrder, status } })
          }
        }
      },

      clearActiveOrder: () => {
        set({ activeOrder: null })
      },

      hasActiveOrder: () => {
        return get().activeOrder !== null
      },

      isOrderInProgress: () => {
        const { activeOrder } = get()
        if (!activeOrder) return false
        return IN_PROGRESS_STATUSES.includes(activeOrder.status)
      },
    }),
    {
      name: 'active-order-storage',
    }
  )
)
