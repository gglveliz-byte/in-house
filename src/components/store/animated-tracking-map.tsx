'use client'

import { useEffect, useState } from 'react'
import { Store, Home, Bike, CheckCircle, Clock } from 'lucide-react'

interface AnimatedTrackingMapProps {
  status: string
  pickedUpAt: string | null
  storeName: string
  customerAddress: string
}

export function AnimatedTrackingMap({
  status,
  pickedUpAt,
  storeName,
  customerAddress,
}: AnimatedTrackingMapProps) {
  const [progress, setProgress] = useState(0) // 0 to 100
  const [estimatedTime, setEstimatedTime] = useState('10-15 min')

  useEffect(() => {
    if (status === 'DELIVERED') {
      setProgress(100)
      setEstimatedTime('Entregado')
      return
    }

    if (status === 'CANCELLED') {
      setProgress(0)
      setEstimatedTime('Cancelado')
      return
    }

    const activeSteps = ['PENDING', 'CONFIRMED', 'READY']
    if (activeSteps.includes(status)) {
      setProgress(0)
      setEstimatedTime('15-20 min')
      return
    }

    // Si está en camino (PICKED_UP)
    const calculateProgress = () => {
      if (!pickedUpAt) {
        setProgress(15)
        setEstimatedTime('10-15 min')
        return
      }

      const start = new Date(pickedUpAt).getTime()
      const now = Date.now()
      const totalDuration = 10 * 60 * 1000 // 10 minutos en ms

      const elapsed = now - start
      const percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 10), 95)
      setProgress(percentage)

      // Calcular tiempo restante estimado
      const remainingMin = Math.max(Math.ceil((totalDuration - elapsed) / (60 * 1000)), 1)
      if (remainingMin <= 1) {
        setEstimatedTime('Llegando ahora')
      } else {
        setEstimatedTime(`${remainingMin} min restante${remainingMin > 1 ? 's' : ''}`)
      }
    }

    calculateProgress()
    const interval = setInterval(calculateProgress, 2000)
    return () => clearInterval(interval)
  }, [status, pickedUpAt])

  // Ajustar el porcentaje de left para el repartidor
  const bikeLeft = `${progress}%`

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            Ruta de Entrega en Vivo
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate md:max-w-none">
            {status === 'PICKED_UP' ? `Hacia: ${customerAddress}` : `De: ${storeName}`}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-right shrink-0">
          <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Llegada Estimada</span>
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-orange-500 animate-spin" style={{ animationDuration: '3s' }} />
            {estimatedTime}
          </span>
        </div>
      </div>

      {/* Schematic Map Container */}
      <div className="relative h-28 bg-gradient-to-r from-green-50/40 via-orange-50/20 to-amber-50/40 rounded-xl border border-slate-100/80 p-4 flex items-center overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-40 pointer-events-none" />

        {/* Path line */}
        <div className="absolute left-10 right-10 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
          {/* Animated active tracking path */}
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-orange-500 to-amber-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Store Marker */}
        <div className="absolute left-6 flex flex-col items-center z-10">
          <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg border-2 border-white transition-all duration-300">
            <Store className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Tienda</span>
        </div>

        {/* Repartidor / Moto */}
        {status === 'PICKED_UP' && (
          <div 
            className="absolute z-20 flex flex-col items-center transition-all duration-1000 ease-out -translate-x-1/2"
            style={{ left: bikeLeft }}
          >
            {/* Pulsing glow under bike */}
            <div className="absolute w-8 h-8 rounded-full bg-orange-400/30 animate-ping" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white relative">
              <Bike className="w-4 h-4 animate-bounce" style={{ animationDuration: '1.2s' }} />
            </div>
            <span className="text-[8px] font-extrabold text-orange-600 mt-1 uppercase tracking-wider bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 whitespace-nowrap shadow-sm">En camino</span>
          </div>
        )}

        {/* Cliente Marker */}
        <div className="absolute right-6 flex flex-col items-center z-10">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all duration-500 ${
            status === 'DELIVERED' 
              ? 'bg-orange-600 text-white' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            {status === 'DELIVERED' ? (
              <CheckCircle className="w-4 h-4 animate-pulse" />
            ) : (
              <Home className="w-4 h-4" />
            )}
          </div>
          <span className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${
            status === 'DELIVERED' ? 'text-orange-600 font-extrabold' : 'text-slate-400'
          }`}>
            Destino
          </span>
        </div>
      </div>

      {/* Dynamic tracking description footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Estado: <strong className="text-slate-700">
          {status === 'PENDING' && 'Recibiendo orden en tienda...'}
          {status === 'CONFIRMED' && 'Preparando tus productos...'}
          {status === 'READY' && '¡Pedido listo para ser recogido!'}
          {status === 'PICKED_UP' && '¡El repartidor va hacia ti!'}
          {status === 'DELIVERED' && '¡Entregado! Que disfrutes tu compra.'}
          {status === 'CANCELLED' && 'Pedido cancelado.'}
        </strong></span>
        {status === 'PICKED_UP' && (
          <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full animate-pulse border border-green-100">
            En vivo
          </span>
        )}
      </div>
    </div>
  )
}
