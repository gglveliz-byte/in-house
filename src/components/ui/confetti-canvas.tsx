'use client'

import React, { useEffect, useRef } from 'react'

interface ConfettiParticle {
  x: number
  y: number
  size: number
  color: string
  shape: 'circle' | 'square' | 'triangle'
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  opacity: number
  oscillationSpeed: number
  oscillationOffset: number
}

const COLORS = [
  '#0056b3', // Blue Primary
  '#3b82f6', // Light Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber/Yellow
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
]

export const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let active = true

    // Set canvas dimensions
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const particles: ConfettiParticle[] = []

    // Helper to spawn a single particle
    const createParticle = (isInitialBurst = false): ConfettiParticle => {
      const size = Math.random() * 8 + 6
      return {
        x: Math.random() * canvas.width,
        y: isInitialBurst ? Math.random() * canvas.height * 0.4 - size : -size - 20,
        size,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2,
        opacity: 1,
        oscillationSpeed: Math.random() * 0.05 + 0.02,
        oscillationOffset: Math.random() * Math.PI * 2,
      }
    }

    // Spawn initial blast
    for (let i = 0; i < 120; i++) {
      particles.push(createParticle(true))
    }

    // Animation Loop
    const render = (time: number) => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Periodically spawn new particles from the top while active
      if (active && particles.length < 180 && Math.random() < 0.3) {
        particles.push(createParticle(false))
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]

        // Gravity and physics
        p.y += p.vy
        p.x += p.vx + Math.sin(time * p.oscillationSpeed + p.oscillationOffset) * 0.5
        p.rotation += p.rotationSpeed

        // Slow fall-off or fade near the bottom
        if (p.y > canvas.height - 100) {
          p.opacity -= 0.02
        }

        // Remove off-screen or invisible particles
        if (p.y > canvas.height || p.opacity <= 0 || p.x < -50 || p.x > canvas.width + 50) {
          particles.splice(i, 1)
          continue
        }

        // Draw particle
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x + p.size / 2, p.y + p.size / 2)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color

        ctx.beginPath()
        if (p.shape === 'circle') {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        } else if (p.shape === 'triangle') {
          ctx.moveTo(0, -p.size / 2)
          ctx.lineTo(p.size / 2, p.size / 2)
          ctx.lineTo(-p.size / 2, p.size / 2)
          ctx.closePath()
          ctx.fill()
        }
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    // Stop spawning after 1.8 seconds, letting existing confetti drain down gracefully
    const stopSpawnerTimeout = setTimeout(() => {
      active = false
    }, 1800)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
      clearTimeout(stopSpawnerTimeout)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none w-full h-full z-[9999]"
      style={{ display: 'block' }}
    />
  )
}
