'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Shield, Trophy, Zap } from 'lucide-react'
import type { User } from '@/lib/types'

interface DemoOverlayProps {
  user?: User | null
  onTriggerPaywall: () => void
}

export default function DemoOverlay({ user, onTriggerPaywall }: DemoOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes = 180 seconds
  const [showReferralBanner, setShowReferralBanner] = useState(false)

  // Only show for demo plan users or logged out visitors
  const isDemo = !user || user.plan === 'demo'

  useEffect(() => {
    if (!isDemo) return

    // Check document referrer for external links (referrals)
    if (typeof window !== 'undefined' && document.referrer) {
      const isExternal = !document.referrer.includes(window.location.hostname)
      if (isExternal && !user) {
        setShowReferralBanner(true)
        const bannerTimer = setTimeout(() => setShowReferralBanner(false), 30000)
        return () => clearTimeout(bannerTimer)
      }
    }
  }, [isDemo, user])

  // Countdown timer
  useEffect(() => {
    if (!isDemo) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onTriggerPaywall()
          return 0
        }
        // Auto trigger paywall 3 seconds after entering Phase 5 (15 seconds remaining)
        if (prev === 12) {
          onTriggerPaywall()
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isDemo, onTriggerPaywall])

  // Calculate phase based on timeline
  const phase = useMemo(() => {
    if (timeLeft > 135) return 1  // Phase 1: 0:00 - 0:45 (180s to 135s remaining)
    if (timeLeft > 90) return 2   // Phase 2: 0:45 - 1:30 (135s to 90s remaining)
    if (timeLeft > 45) return 3   // Phase 3: 1:30 - 2:15 (90s to 45s remaining)
    if (timeLeft > 15) return 4   // Phase 4: 2:15 - 2:45 (45s to 15s remaining)
    return 5                      // Phase 5: 2:45 - 3:00 (15s to 0s remaining)
  }, [timeLeft])

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `DEMO ENDS IN ${minutes}:${String(seconds).padStart(2, '0')}`
  }, [timeLeft])

  if (!isDemo) return null

  return (
    <>
      {/* Referral Alert Banner */}
      <AnimatePresence>
        {showReferralBanner && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[150] bg-purple-950/80 backdrop-blur-md border-b border-purple-500/40 text-purple-300 text-sm font-rajdhani font-semibold text-center py-2.5 px-4 tracking-wider flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(124,58,237,0.2)]"
          >
            <span>⚔️ A fellow Hunter arose here. Will you? ⚔️</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Transparent Click Interceptor */}
      <div 
        className="fixed inset-0 z-40 bg-transparent cursor-pointer"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onTriggerPaywall()
        }}
      />

      {/* Spotlight Tour Content (Renders on top of the interceptor) */}
      <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/75">
        
        {/* Phase Animations */}
        <div className="w-full max-w-lg px-6 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            
            {/* PHASE 1: XP & RANK */}
            {phase === 1 && (
              <motion.div
                key="phase1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 w-full"
              >
                <div className="p-6 rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-md shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-exo2 font-black text-xs text-purple-400 tracking-wider">HUNTER PROGRESS</span>
                    <motion.span 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="px-2 py-0.5 rounded bg-purple-900/50 border border-purple-500/40 font-rajdhani text-xs font-bold text-purple-300"
                    >
                      LEVEL 12
                    </motion.span>
                  </div>
                  
                  {/* Mock filling XP Bar */}
                  <div className="h-4 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative p-0.5 mb-6">
                    <motion.div
                      initial={{ width: '5%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.7)]"
                    />
                  </div>

                  {/* Rank Badges shifting */}
                  <div className="flex justify-center items-center gap-6">
                    <div className="text-center opacity-40 scale-90">
                      <div className="w-12 h-12 rounded-full border border-neutral-600 flex items-center justify-center font-exo2 font-black text-lg bg-neutral-900 text-neutral-400">E</div>
                      <span className="text-[10px] font-rajdhani font-bold mt-1 block">E-RANK</span>
                    </div>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                      className="text-3xl text-purple-500"
                    >
                      ⚡
                    </motion.div>
                    <div className="text-center">
                      <motion.div 
                        animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 10px rgba(6,182,212,0.3)', '0 0 25px rgba(6,182,212,0.8)', '0 0 10px rgba(6,182,212,0.3)'] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-16 h-16 rounded-full border-2 border-cyan-400 flex items-center justify-center font-exo2 font-black text-2xl bg-cyan-950/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                      >
                        C
                      </motion.div>
                      <span className="text-xs font-rajdhani font-black text-cyan-300 mt-1.5 block tracking-wider">C-RANK</span>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-exo2 font-black uppercase text-white tracking-wide">
                  EARN XP WITH EVERY <span className="text-purple-400">CHALLENGE</span> YOU COMPLETE
                </h2>
              </motion.div>
            )}

            {/* PHASE 2: DAILY QUESTS */}
            {phase === 2 && (
              <motion.div
                key="phase2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 w-full"
              >
                <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-left">
                      <span className="text-[10px] font-rajdhani font-black text-cyan-400 uppercase tracking-widest block mb-1">QUEST 01 · FITNESS</span>
                      <h3 className="font-exo2 font-black text-base text-white tracking-wider">100 PUSHUPS DAILY</h3>
                      <p className="font-rajdhani text-xs text-neutral-400 mt-0.5">Complete in sets. Push past your limits.</p>
                    </div>
                    
                    {/* Simulated Checkmark trigger */}
                    <div className="relative">
                      <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [1, 1.2, 1], borderColor: ['#0891b2', '#22d3ee', '#0891b2'] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-10 h-10 rounded border-2 border-cyan-600 flex items-center justify-center bg-black/40 text-cyan-400"
                      >
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1, duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                          <Check className="w-6 h-6 stroke-[3px]" />
                        </motion.span>
                      </motion.div>

                      {/* Floating Reward */}
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: [0, 1, 0], y: [-10, -50, -60] }}
                        transition={{ delay: 1.2, duration: 1.8, repeat: Infinity, repeatDelay: 1.7 }}
                        className="absolute -top-6 -right-6 font-exo2 font-black text-sm text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]"
                      >
                        +150 XP
                      </motion.span>
                    </div>
                  </div>

                  {/* Completion badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: [0, 1, 1, 0], x: [-50, 0, 0, 50] }}
                    transition={{ delay: 1.3, duration: 2.2, repeat: Infinity, repeatDelay: 1.3 }}
                    className="mt-4 py-1 px-3 bg-cyan-500/20 border border-cyan-400/40 rounded text-center text-xs font-exo2 font-black uppercase text-cyan-300 tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  >
                    QUEST COMPLETE
                  </motion.div>
                </div>

                <h2 className="text-2xl font-exo2 font-black uppercase text-white tracking-wide">
                  COMPLETE <span className="text-cyan-400">DAILY QUESTS</span>.<br />NEVER MISS A DAY.
                </h2>
              </motion.div>
            )}

            {/* PHASE 3: SHADOW ARMY */}
            {phase === 3 && (
              <motion.div
                key="phase3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 w-full"
              >
                {/* Simulated shadow figures rising */}
                <div className="h-44 w-full relative overflow-hidden rounded-xl border border-purple-500/20 bg-purple-950/5 flex items-end justify-center gap-4 px-6 py-2">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                  
                  {/* Floating purple particles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [0, -120],
                        x: [0, Math.sin(i) * 30],
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1.2, 0.5]
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                      }}
                      className="absolute bottom-4 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#a855f7]"
                      style={{ left: `${15 + i * 10}%` }}
                    />
                  ))}

                  {/* Silhouettes rising */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.25 }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                    className="flex justify-center items-end gap-3 z-20 w-full"
                  >
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        variants={{
                          hidden: { y: 60, opacity: 0 },
                          show: { y: 0, opacity: 0.75, transition: { type: 'spring', bounce: 0.2, duration: 1.5 } }
                        }}
                        className="w-16 bg-neutral-900 border-t border-purple-500/50 rounded-t-lg flex flex-col items-center py-2 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                        style={{ height: `${50 + i * 20}px` }}
                      >
                        <Shield className="w-5 h-5 text-purple-400/60" />
                        <span className="text-[8px] font-rajdhani text-purple-400 font-bold mt-1">LVL {3 + i}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <h2 className="text-2xl font-exo2 font-black uppercase text-white tracking-wide">
                  BUILD YOUR <span className="text-purple-400">SHADOW ARMY</span>.<br />
                  <motion.span 
                    animate={{ textShadow: ['0 0 10px #a855f7', '0 0 25px #a855f7', '0 0 10px #a855f7'] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-white bg-purple-900/30 px-3 py-1 rounded border border-purple-500/30"
                  >
                    ARISE.
                  </motion.span>
                </h2>
              </motion.div>
            )}

            {/* PHASE 4: LEADERBOARD */}
            {phase === 4 && (
              <motion.div
                key="phase4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 w-full"
              >
                <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-950/5 backdrop-blur-md shadow-[0_0_30px_rgba(251,191,36,0.1)] text-left space-y-2">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="font-exo2 font-black text-xs text-yellow-500 tracking-wider">GLOBAL LEADERBOARD</span>
                  </div>
                  
                  {/* Leaderboard entries */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5 px-3 bg-white/5 rounded text-xs">
                      <span className="font-bold text-neutral-400">#2 Sung Jin-Woo</span>
                      <span className="font-rajdhani font-black text-yellow-400">92,450 XP</span>
                    </div>

                    {/* Animated ascending user card */}
                    <motion.div
                      animate={{ 
                        y: [0, 0],
                        borderColor: ['rgba(168,85,247,0.3)', 'rgba(251,191,36,0.8)', 'rgba(168,85,247,0.3)']
                      }}
                      className="flex items-center justify-between py-2 px-3 bg-purple-950/40 border border-purple-500/30 rounded text-xs shadow-[0_0_15px_rgba(124,58,237,0.15)] relative overflow-hidden"
                    >
                      <div className="flex items-center gap-2">
                        {/* Shifting position */}
                        <motion.span
                          animate={{ 
                            content: ['#847', '#23', '#1']
                          }}
                          className="font-exo2 font-black text-purple-400"
                        >
                          #1
                        </motion.span>
                        <span className="font-bold text-white">YOU (HUNTER)</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-rajdhani font-black text-white">99,850 XP</span>
                        {/* Glowing Crown on rank #1 */}
                        <motion.span
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: [0, 1.2, 1], rotate: [0, 360, 0] }}
                          transition={{ repeat: Infinity, duration: 4, repeatDelay: 1 }}
                          className="text-yellow-400 text-sm"
                        >
                          👑
                        </motion.span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <h2 className="text-2xl font-exo2 font-black uppercase text-white tracking-wide">
                  COMPETE. DOMINATE.<br />
                  BECOME THE <span className="text-yellow-400">SHADOW MONARCH</span>.
                </h2>
              </motion.div>
            )}

            {/* PHASE 5: TRIAL ENDED */}
            {phase === 5 && (
              <motion.div
                key="phase5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 w-full flex flex-col items-center"
              >
                {/* Electric sparks burst layout */}
                <div className="w-24 h-24 rounded-full border-2 border-purple-500 flex items-center justify-center bg-purple-950/20 shadow-[0_0_30px_rgba(168,85,247,0.5)] relative mb-4">
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
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* BOTTOM HEADER STATS / ACTION BUTTONS */}
        <div className="absolute bottom-10 left-6 right-6 flex items-center justify-between pointer-events-auto">
          {/* Skip button (bottom-left) */}
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onTriggerPaywall()
            }}
            className="px-4 py-2 text-xs font-rajdhani font-semibold text-neutral-400 hover:text-white uppercase tracking-wider transition-colors duration-200 bg-neutral-900/40 hover:bg-neutral-900/80 rounded border border-white/5 opacity-60 hover:opacity-100"
          >
            Skip Tour
          </button>

          {/* Floating countdown timer (bottom-right) */}
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
      </div>
    </>
  )
}
