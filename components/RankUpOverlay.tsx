'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import type { Rank } from '@/lib/types'
import { RANK_COLORS } from '@/lib/constants'
import RankBadge from './RankBadge'

interface RankUpOverlayProps {
  show: boolean
  newRank: Rank
  oldRank: Rank
  onDismiss: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  angle: number
  distance: number
  size: number
  color: string
  duration: number
}

function generateParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 10,
    y: 50 + (Math.random() - 0.5) * 10,
    angle: (i / count) * 360 + Math.random() * 20,
    distance: 80 + Math.random() * 150,
    size: 4 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    duration: 0.8 + Math.random() * 0.6,
  }))
}

export default function RankUpOverlay({ show, newRank, oldRank: _oldRank, onDismiss }: RankUpOverlayProps) {
  const colors = RANK_COLORS[newRank]
  const [particles, setParticles] = useState<Particle[]>([])
  const [showParticles, setShowParticles] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (show) {
      // Generate particles when overlay shows
      setParticles(
        generateParticles(30, [colors.text, '#7c3aed', '#06b6d4', '#ffffff'])
      )
      // Trigger particles after badge appears
      const pt = setTimeout(() => setShowParticles(true), 800)
      // Auto dismiss
      timerRef.current = setTimeout(() => {
        setShowParticles(false)
        onDismiss()
      }, 3500)

      return () => {
        clearTimeout(pt)
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    } else {
      setShowParticles(false)
    }
  }, [show, colors.text, onDismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(4,4,12,0.92)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current)
            onDismiss()
          }}
        >
          {/* Radial glow background */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${colors.glow.replace('0.', '0.3 ')} 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />

          {/* Particle burst */}
          {showParticles && particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180
            const tx = Math.cos(rad) * p.distance
            const ty = Math.sin(rad) * p.distance
            return (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  boxShadow: `0 0 6px ${p.color}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: tx,
                  y: ty,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: p.duration, ease: 'easeOut' }}
              />
            )
          })}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
            {/* RANK UP text */}
            <motion.div
              initial={{ opacity: 0, scale: 3, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            >
              <h1
                className="text-5xl md:text-7xl font-exo2 font-black uppercase tracking-wider"
                style={{
                  color: colors.text,
                  textShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
                }}
              >
                RANK UP
              </h1>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7, type: 'spring', stiffness: 150 }}
              className="relative"
            >
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <RankBadge rank={newRank} size="xl" animated />
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="space-y-1"
            >
              <p
                className="text-xl md:text-2xl font-exo2 font-black uppercase tracking-widest"
                style={{ color: colors.text }}
              >
                YOU ARE NOW RANK {newRank}
              </p>
              <p className="text-sm font-rajdhani text-muted-foreground">
                {newRank === 'SSS'
                  ? 'You have become the Shadow Monarch.'
                  : `Keep pushing. Rank ${newRank} awaits new challenges.`}
              </p>
              <p className="text-xs text-muted-foreground/50 mt-2">Tap anywhere to continue</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
