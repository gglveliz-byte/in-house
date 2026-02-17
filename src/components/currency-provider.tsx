'use client'

import { useEffect } from 'react'
import { setActiveCurrency } from '@/lib/utils'

export function CurrencyProvider() {
  useEffect(() => {
    const saved = localStorage.getItem('zoneCurrency')
    if (saved) {
      setActiveCurrency(saved)
    }
  }, [])

  return null
}
