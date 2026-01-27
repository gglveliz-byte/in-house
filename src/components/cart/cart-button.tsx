'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/stores/cart-store'
import { formatPrice } from '@/lib/utils'

export function CartButton() {
  const [mounted, setMounted] = useState(false)
  const { items, getTotal, getItemCount } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Evitar hydration mismatch
  if (!mounted) {
    return (
      <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
    )
  }

  const itemCount = getItemCount()

  if (itemCount === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <span className="text-xl">🛒</span>
        <span className="text-sm hidden sm:inline">Carrito vacío</span>
      </div>
    )
  }

  return (
    <Link href="/checkout">
      <div className="flex items-center gap-3 bg-primary-600 text-white px-4 py-2 rounded-full hover:bg-primary-700 transition-colors">
        <span className="text-xl">🛒</span>
        <div className="flex flex-col items-start">
          <span className="text-xs">{itemCount} items</span>
          <span className="font-semibold">{formatPrice(getTotal())}</span>
        </div>
      </div>
    </Link>
  )
}
