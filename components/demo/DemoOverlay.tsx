'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { User } from '@/lib/types'

interface DemoOverlayProps {
  user?: User | null
  onTriggerPaywall: () => void
}

export default function DemoOverlay({ user, onTriggerPaywall }: DemoOverlayProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Only show for logged in demo plan users
  const isDemo = !!(user && user.plan === 'demo')

  // Initialize trial expiration from localStorage
  useEffect(() => {
    if (!isDemo) return

    const key = 'victarc_trial_expires_at'
    const now = Date.now()
    const expiresAt = localStorage.getItem(key)

    if (!expiresAt) {
      // 3 minutes = 180 seconds from now
      const expiry = now + 180 * 1000
      localStorage.setItem(key, String(expiry))
      setTimeLeft(180)
    } else {
      const remaining = Math.max(0, Math.floor((Number(expiresAt) - now) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        onTriggerPaywall()
      }
    }
  }, [isDemo, onTriggerPaywall])

  // Countdown timer interval
  useEffect(() => {
    if (!isDemo || timeLeft === null || timeLeft <= 0) return

    const interval = setInterval(() => {
      const key = 'victarc_trial_expires_at'
      const expiresAt = localStorage.getItem(key)
      const now = Date.now()
      
      let remaining = 0
      if (expiresAt) {
        remaining = Math.max(0, Math.floor((Number(expiresAt) - now) / 1000))
      } else {
        remaining = 180
      }

      setTimeLeft(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        onTriggerPaywall()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isDemo, timeLeft, onTriggerPaywall])

  const formattedTime = useMemo(() => {
    if (timeLeft === null) return 'DEMO ENDS IN 3:00'
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `DEMO ENDS IN ${minutes}:${String(seconds).padStart(2, '0')}`
  }, [timeLeft])

  if (!isDemo || timeLeft === null) return null

  const isExpired = timeLeft <= 0

  return (
    <>
      {/* If trial is still active, only render the floating countdown timer in the corner */}
      {!isExpired && (
        <div className="fixed bottom-6 right-6 z-[100] pointer-events-auto">
          <motion.div
            animate={{ 
              scale: [1, 1.02, 1],
              boxShadow: [
                '0 0 10px rgba(168, 85, 247, 0.2)',
                '0 0 20px rgba(168, 85, 247, 0.4)',
                '0 0 10px rgba(168, 85, 247, 0.2)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="px-4 py-2 bg-purple-950/80 border border-purple-500/50 rounded-full font-mono text-xs font-bold text-purple-300 tracking-wider flex items-center gap-2 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>{formattedTime}</span>
          </motion.div>
        </div>
      )}

      {/* If trial has ended, block the screen and present the payment wall trigger */}
      {isExpired && (
        <>
          {/* Transparent Click Interceptor to open paywall */}
          <div 
            className="fixed inset-0 z-[140] bg-transparent cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onTriggerPaywall()
            }}
          />

          {/* Full Screen Black Blocking Overlay */}
          <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-lg px-6 flex flex-col items-center text-center space-y-6">
              
              {/* Electric sparks burst layout */}
              <div className="w-24 h-24 rounded-full border-2 border-purple-500 flex items-center justify-center bg-purple-950/20 shadow-[0_0_30px_rgba(168,85,247,0.5)] relative">
                <motion.div
                  animate={{
                    scale: [1, 2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5
                  }}
                  className="absolute inset-0 rounded-full border-2 border-purple-400"
                />
                <Zap className="w-12 h-12 text-white animate-pulse" />
              </div>
              
              <h1 className="text-4xl font-exo2 font-black uppercase tracking-widest text-white">
                YOUR TRIAL HAS ENDED.
              </h1>
              
              <p className="text-xl font-rajdhani font-bold text-purple-400 tracking-widest animate-pulse uppercase">
                WILL YOU ARISE?
              </p>

              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onTriggerPaywall()
                }}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-exo2 font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all pointer-events-auto"
              >
                Unlock Access Now
              </button>

            </div>
          </div>
        </>
      )}
    </>
  )
}
