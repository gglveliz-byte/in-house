'use client'

import { useEffect } from 'react'
import { setActiveCurrency } from '@/lib/utils'

export function DashboardCurrencyProvider({ currency }: { currency: string }) {
  useEffect(() => {
    setActiveCurrency(currency)
  }, [currency])
  return null
}
