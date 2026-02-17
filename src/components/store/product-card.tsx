'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  store: {
    id: string
    name: string
    whatsapp: string
    deliveryFee: number
  }
}

export function ProductCard({ product, store }: ProductCardProps) {
  const { addItem, setStore, storeId } = useCartStore()

  const handleAddToCart = () => {
    // Si es el primer producto o de la misma tienda
    if (!storeId || storeId === store.id) {
      setStore(store.id, store.name, store.whatsapp, store.deliveryFee)
    }
    addItem(product)
  }

  return (
    <div className="group card overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-green-200">
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center">
        {product.image ? (
          <div className="relative w-full h-full flex items-center justify-center bg-white p-2">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-orange-100">
            <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🍔</span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent group-hover:from-black/10 transition-all duration-300 pointer-events-none" />
      </div>

      {/* Product Info */}
      <div className="p-5 flex-1 flex flex-col bg-white">
        <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed flex-1">
            {product.description}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Precio</span>
            <span className="text-2xl font-extrabold text-green-600">
              {formatPrice(product.price)}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            aria-label={`Agregar ${product.name} al carrito`}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            + Agregar
          </Button>
        </div>
      </div>
    </div>
  )
}
