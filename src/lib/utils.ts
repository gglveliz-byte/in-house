import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Map currency codes to locale for proper formatting
const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  MXN: 'es-MX',
  COP: 'es-CO',
  ARS: 'es-AR',
  PEN: 'es-PE',
  CLP: 'es-CL',
  BRL: 'pt-BR',
  EUR: 'es-ES',
  VES: 'es-VE',
  BOB: 'es-BO',
  UYU: 'es-UY',
  PYG: 'es-PY',
  GTQ: 'es-GT',
  HNL: 'es-HN',
  NIO: 'es-NI',
  CRC: 'es-CR',
  PAB: 'es-PA',
  DOP: 'es-DO',
  CUP: 'es-CU',
}

// Global currency state - set by zone selection
let _activeCurrency = 'USD'

export function setActiveCurrency(currency: string) {
  _activeCurrency = currency
}

export function getActiveCurrency(): string {
  return _activeCurrency
}

export function formatPrice(price: number, currency?: string): string {
  const cur = currency || _activeCurrency
  const locale = CURRENCY_LOCALES[cur] || 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: cur === 'CLP' || cur === 'PYG' || cur === 'COP' ? 0 : 2,
    maximumFractionDigits: cur === 'CLP' || cur === 'PYG' || cur === 'COP' ? 0 : 2,
  }).format(price)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    READY: 'Listo para recoger',
    PICKED_UP: 'En camino',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  }
  return labels[status] || status
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    READY: 'bg-purple-100 text-purple-800',
    PICKED_UP: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
