'use client'

import { useEffect, useRef } from 'react'


export default function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const particles: HTMLDivElement[] = []
    const count = 60

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div')
      const size = 1 + Math.random() * 3
      const x = Math.random() * 100
      const delay = Math.random() * 8
      const duration = 6 + Math.random() * 10
      const drift = (Math.random() - 0.5) * 80

      // Colors: purple, cyan, blue mix
      const colors = ['#7c3aed', '#06b6d4', '#2563eb', '#a78bfa', '#67e8f9']
      const color = colors[Math.floor(Math.random() * colors.length)]

      el.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}%;
        bottom: -10px;
        background: ${color};
        border-radius: 50%;
        opacity: 0;
        box-shadow: 0 0 ${size * 2}px ${color};
        animation: particle-float ${duration}s ${delay}s ease-in-out infinite;
        --drift: ${drift}px;
        pointer-events: none;
      `

      container.appendChild(el)
      particles.push(el)
    }

    return () => {
      particles.forEach((el) => el.remove())
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    />
  )
}
