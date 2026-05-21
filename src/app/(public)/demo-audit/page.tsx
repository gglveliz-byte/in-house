'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface LogEntry {
  step: string
  message: string
  status: 'SUCCESS' | 'INFO' | 'WARNING'
  timestamp: string
}

interface AuditMetrics {
  orderNumber: number
  todaySales: number
  todayOrders: number
  zoneCompletedOrders: number
  platformFee: number
}

export default function DemoAuditPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [visibleLogs, setVisibleLogs] = useState<LogEntry[]>([])
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1)

  const stepsList = [
    { name: '🔌 Conectar DB', desc: 'Validación de conexión con Neon PostgreSQL' },
    { name: '🛒 Checkout Cliente', desc: 'Creación de orden transaccional #1005' },
    { name: '👨‍🍳 Confirmación Vendedor', desc: 'Verificación de pago y preparación' },
    { name: '🏍️ Despacho Repartidor', desc: 'Asignación de zona y cálculo de flete' },
    { name: '🎉 Pedido Entregado', desc: 'Cierre de ciclo transaccional y cobro' },
    { name: '📊 Actualización KPIs', desc: 'Recálculo de gráficos y comisiones' }
  ]

  const runLiveAudit = async () => {
    setIsRunning(true)
    setCompleted(false)
    setVisibleLogs([])
    setMetrics(null)
    setCurrentStepIndex(0)

    try {
      const response = await fetch('/api/demo-audit/run', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Fallo en la ejecución de la auditoría')
      }
      const data = await response.json()
      
      const allLogs: LogEntry[] = data.logs
      const finalMetrics: AuditMetrics = data.metrics

      // Simular un retardo progresivo para que el usuario pueda ver los pasos animarse en pantalla
      for (let i = 0; i < allLogs.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        setVisibleLogs((prev) => [...prev, allLogs[i]])
        
        // Mapear los logs al índice de pasos de la barra lateral visual
        const logStep = allLogs[i].step
        if (logStep === 'DATABASE') setCurrentStepIndex(0)
        else if (logStep === 'CHECKOUT') setCurrentStepIndex(1)
        else if (logStep === 'VENDEDOR') setCurrentStepIndex(2)
        else if (logStep === 'REPARTIDOR') setCurrentStepIndex(3)
        else if (logStep === 'STATS') setCurrentStepIndex(5)
      }

      setMetrics(finalMetrics)
      setCompleted(true)
      setCurrentStepIndex(6) // Todos completados
    } catch (error) {
      console.error(error)
      setVisibleLogs((prev) => [
        ...prev,
        {
          step: 'ERROR',
          message: 'Error de red o de base de datos durante la auditoría.',
          status: 'WARNING',
          timestamp: new Date().toLocaleTimeString()
        }
      ])
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center py-10 px-4 md:px-8">
      <div className="max-w-5xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 text-sm font-semibold rounded-full animate-pulse">
            ● Auditoría de Sistema Activo
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-[#0056b3]">
            Consola de Monitoreo E2E
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
            Presiona el botón para ejecutar una simulación transaccional en tiempo real. Observa paso a paso cómo se validan las transacciones, se enlazan las bases de datos y se actualizan los paneles de métricas.
          </p>
        </div>

        {/* Control Button */}
        <div className="flex justify-center">
          <Button
            onClick={runLiveAudit}
            disabled={isRunning}
            className={`px-8 py-6 rounded-2xl text-lg font-bold shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isRunning
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/10'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent" />
                Ejecutando Auditoría...
              </span>
            ) : completed ? (
              '🔄 Reiniciar Auditoría en Vivo'
            ) : (
              '🚀 Iniciar Auditoría en Vivo'
            )}
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Pasos visuales */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-lg text-slate-300 flex items-center gap-2 pl-1">
              <span>📍</span> Fases del Flujo
            </h3>
            <div className="space-y-3">
              {stepsList.map((step, idx) => {
                const isActive = idx === currentStepIndex
                const isPassed = idx < currentStepIndex
                return (
                  <div
                    key={step.name}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/20 scale-[1.02]'
                        : isPassed
                        ? 'bg-slate-900/40 border-slate-800 opacity-90'
                        : 'bg-slate-900/20 border-slate-900/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-sm ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {step.name}
                      </span>
                      {isPassed && (
                        <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Aprobado ✓
                        </span>
                      )}
                      {isActive && (
                        <span className="animate-pulse text-amber-400 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                          Procesando...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Columna Derecha: Terminal Ticker & Métricas */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Terminal Logs */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl overflow-hidden flex flex-col h-[320px]">
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">live-audit-logger.sh</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">PORT 3000</span>
              </div>
              
              <div className="p-4 font-mono text-xs overflow-y-auto flex-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
                {visibleLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">
                    Esperando inicio de auditoría...
                  </div>
                ) : (
                  visibleLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 animate-fadeIn">
                      <span className="text-slate-500 font-light">[{log.timestamp}]</span>
                      <span className={`font-bold ${
                        log.status === 'INFO' ? 'text-blue-400' :
                        log.status === 'WARNING' ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {log.step}:
                      </span>
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'Orden Creada', val: metrics ? `#${metrics.orderNumber}` : '--', color: 'text-blue-400' },
                { title: 'Ventas de Hoy', val: metrics ? `$${metrics.todaySales.toFixed(2)}` : '--', color: 'text-emerald-400' },
                { title: 'Pedidos Entregados', val: metrics ? metrics.zoneCompletedOrders : '--', color: 'text-amber-400' },
                { title: 'Comisión Plataforma', val: metrics ? `$${metrics.platformFee.toFixed(2)}` : '--', color: 'text-purple-400' }
              ].map((m, idx) => (
                <Card key={idx} className="bg-slate-900/40 border-slate-800 shadow-lg text-center p-4">
                  <p className="text-xs text-slate-400 mb-1 font-semibold">{m.title}</p>
                  <p className={`text-xl md:text-2xl font-black ${m.color} transition-all duration-500`}>
                    {m.val}
                  </p>
                </Card>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
