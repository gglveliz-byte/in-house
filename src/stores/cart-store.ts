import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  storeId: string | null
  storeName: string | null
  storeWhatsapp: string | null
  deliveryFee: number
  activeOrderId: string | null

  // Actions
  addItem: (
    product: Product,
    quantity?: number,
    storeMeta?: {
      storeId: string
      storeName: string
      whatsapp: string
      deliveryFee: number
    }
  ) => boolean
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setStore: (storeId: string, storeName: string, whatsapp: string, deliveryFee: number) => void
  setActiveOrderId: (orderId: string | null) => void

  // Computed
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      storeName: null,
      storeWhatsapp: null,
      deliveryFee: 0,
      activeOrderId: null,

      addItem: (product, quantity = 1, storeMeta) => {
        const { items, storeId } = get()

        // Si el carrito tiene productos de otra tienda, preguntar
        if (storeId && storeId !== product.storeId) {
          const confirm = window.confirm(
            'Tienes productos de otra tienda en el carrito. ¿Deseas vaciar el carrito y agregar este producto?'
          )
          if (!confirm) return false
          set({ items: [], storeId: null, storeName: null, storeWhatsapp: null, deliveryFee: 0 })
        }

        // Si el carrito está vacío y recibimos meta de tienda, configúralo
        if (!get().storeId && storeMeta) {
          set({
            storeId: storeMeta.storeId,
            storeName: storeMeta.storeName,
            storeWhatsapp: storeMeta.whatsapp,
            deliveryFee: storeMeta.deliveryFee,
          })
        }

        const existingItem = get().items.find((item) => item.productId === product.id)

        if (existingItem) {
          set({
            items: get().items.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          })
        } else {
          set({
            items: [...get().items, { productId: product.id, product, quantity }],
          })
        }

        return true
      },

      removeItem: (productId) => {
        const { items } = get()
        const newItems = items.filter((item) => item.productId !== productId)
        set({ items: newItems })
        if (newItems.length === 0) {
          set({ storeId: null, storeName: null, storeWhatsapp: null, deliveryFee: 0 })
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set({
          items: get().items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        })
      },

      clearCart: () => {
        set({
          items: [],
          storeId: null,
          storeName: null,
          storeWhatsapp: null,
          deliveryFee: 0,
        })
      },

      setStore: (storeId, storeName, whatsapp, deliveryFee) => {
        set({ storeId, storeName, storeWhatsapp: whatsapp, deliveryFee })
      },

      setActiveOrderId: (orderId) => {
        set({ activeOrderId: orderId })
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
      },

      getTotal: () => {
        return get().getSubtotal() + get().deliveryFee
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
