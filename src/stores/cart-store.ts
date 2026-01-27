import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  storeId: string | null
  storeName: string | null
  storeWhatsapp: string | null
  deliveryFee: number

  // Actions
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setStore: (storeId: string, storeName: string, whatsapp: string, deliveryFee: number) => void

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

      addItem: (product, quantity = 1) => {
        const { items, storeId } = get()

        // Si el carrito tiene productos de otra tienda, preguntar
        if (storeId && storeId !== product.storeId) {
          const confirm = window.confirm(
            'Tienes productos de otra tienda en el carrito. ¿Deseas vaciar el carrito y agregar este producto?'
          )
          if (!confirm) return
          set({ items: [], storeId: null, storeName: null, storeWhatsapp: null })
        }

        const existingItem = items.find((item) => item.productId === product.id)

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          })
        } else {
          set({
            items: [...items, { productId: product.id, product, quantity }],
          })
        }
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
