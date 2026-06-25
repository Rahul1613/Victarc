'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { LeaderboardEntry, User } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { RANK_COLORS } from '@/lib/constants'
import LeaderboardRow from '@/components/LeaderboardRow'
import { LeaderboardRowSkeleton } from '@/components/SkeletonLoader'
import Link from 'next/link'

interface LeaderboardClientProps {
  initialLeaderboard: LeaderboardEntry[]
  currentUser: User | null
}

type TimeFilter = 'alltime' | 'week'

function TopThreePodium({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) {
  const top3 = entries.slice(0, 3)
  const order = [1, 0, 2] // Silver, Gold, Bronze display order
  const heights = ['h-20', 'h-28', 'h-16']
  const medals = ['🥈', '🥇', '🥉']
  const colors = [
    { text: '#94a3b8', glow: 'rgba(148,163,184,0.3)' },
    { text: '#fbbf24', glow: 'rgba(251,191,36,0.4)' },
    { text: '#fb923c', glow: 'rgba(251,146,60,0.35)' },
  ]

  return (
    <div className="flex items-end justify-center gap-3 mb-8">
      {order.map((idx, displayPos) => {
        const entry = top3[idx]
        if (!entry) return <div key={displayPos} className="w-24" />
        const color = colors[displayPos]
        const rankColors = RANK_COLORS[entry.rank]
        const isMe = entry.id === currentUserId

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: displayPos * 0.1 }}
            className="flex flex-col items-center gap-2"
          >
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-exo2 font-black text-lg relative"
              style={{
                background: `linear-gradient(135deg, ${rankColors.border}, ${rankColors.text}30)`,
                border: `3px solid ${color.text}`,
                boxShadow: `0 0 20px ${color.glow}`,
                color: rankColors.text,
              }}
            >
              {entry.username.slice(0, 2).toUpperCase()}
              {isMe && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                  style={{ background: '#7c3aed', border: '1px solid #a78bfa' }}
                >
                  ✓
                </div>
              )}
            </div>

            {/* Name */}
            <div className="text-center">
              <div
                className="text-xs font-exo2 font-bold uppercase truncate max-w-[80px]"
                style={{ color: color.text }}
              >
                {entry.username}
              </div>
              <div className="text-xs text-muted-foreground font-rajdhani">
                {Number(entry.xp).toLocaleString()} XP
              </div>
            </div>

            {/* Medal badge */}
            <div className="text-xl">{medals[displayPos]}</div>

            {/* Podium */}
            <div
              className={`w-24 ${heights[displayPos]} rounded-t-lg flex items-center justify-center`}
              style={{
                background: `linear-gradient(180deg, ${color.text}20, ${color.text}08)`,
                border: `1px solid ${color.text}40`,
                borderBottom: 'none',
              }}
            >
              <span
                className="text-2xl font-exo2 font-black"
                style={{ color: color.text, textShadow: `0 0 15px ${color.glow}` }}
              >
                #{idx + 1}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function LeaderboardClient({
  initialLeaderboard,
  currentUser,
}: LeaderboardClientProps) {
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('alltime')
  const [weeklyData, setWeeklyData] = useState<LeaderboardEntry[]>([])
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const supabase = createClient()

  // Shadow Monarch Throne Room states
  const [showThroneRoom, setShowThroneRoom] = useState(false)
  const [isRumbling, setIsRumbling] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: string; duration: string; drift: string; size: string }>>([])

  // Close overlay on Escape key
  useEffect(() => {
    if (!showThroneRoom) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowThroneRoom(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showThroneRoom])

  // Crowning ceremony & particles initializer
  useEffect(() => {
    if (!showThroneRoom) return

    // Generate random particles
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${6 + Math.random() * 6}s`,
      drift: `${-100 + Math.random() * 200}px`,
      size: `${2 + Math.random() * 4}px`
    }))
    setParticles(newParticles)

    // Trigger rumbling
    setIsRumbling(true)
    setShowBanner(false)

    // 350ms rumble, then flash & show stats banner
    const flashTimeout = setTimeout(() => {
      setIsRumbling(false)
      setIsFlashing(true)
      setShowBanner(true)

      // Turn off flash after 150ms
      const fadeTimeout = setTimeout(() => {
        setIsFlashing(false)
      }, 150)

      return () => clearTimeout(fadeTimeout)
    }, 350)

    return () => clearTimeout(flashTimeout)
  }, [showThroneRoom])

  // Countdown timer to end of month
  useEffect(() => {
    if (!showThroneRoom) return

    const updateTimer = () => {
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      const diff = endOfMonth.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft('00d 00h 00m 00s')
        return
      }

      const d = Math.floor(diff / (24 * 3600 * 1000))
      const h = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000))
      const m = Math.floor((diff % (3600 * 1000)) / (60 * 1000))
      const s = Math.floor((diff % (60 * 1000)) / 1000)

      setTimeLeft(
        `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [showThroneRoom])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        async () => {
          // Refetch leaderboard on any user update
          const { data } = await supabase
            .from('leaderboard')
            .select('*')
            .limit(50)
          if (data) setLeaderboard(data as LeaderboardEntry[])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Fetch weekly data when switching to weekly filter
  useEffect(() => {
    if (timeFilter !== 'week') return

    async function fetchWeekly() {
      setLoadingWeekly(true)
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        // Get completions from last 7 days grouped by user
        const { data: completions } = await supabase
          .from('completions')
          .select('user_id, xp_earned, users(username, rank, level, avatar_url, streak)')
          .gte('completed_at', weekAgo)

        if (!completions) return

        // Aggregate XP by user
        const userMap = new Map<string, { xp: number; user: unknown }>()
        completions.forEach((c: { user_id: string; xp_earned: number; users: unknown }) => {
          const existing = userMap.get(c.user_id)
          if (existing) {
            existing.xp += c.xp_earned
          } else {
            userMap.set(c.user_id, { xp: c.xp_earned, user: c.users })
          }
        })

        const weekly = Array.from(userMap.entries())
          .map(([id, { xp, user }]) => ({
            id,
            xp,
            ...(user as object),
            total_completions: completions.filter((c: { user_id: string }) => c.user_id === id).length,
            position: 0,
          }))
          .sort((a, b) => b.xp - a.xp)
          .map((entry, i) => ({ ...entry, position: i + 1 }))

        setWeeklyData(weekly as LeaderboardEntry[])
      } finally {
        setLoadingWeekly(false)
      }
    }

    fetchWeekly()
  }, [timeFilter, supabase])

  const displayData = timeFilter === 'week' ? weeklyData : leaderboard

  // Check if current user is in top 20
  const currentUserInTop = currentUser
    ? displayData.slice(0, 20).some((e) => e.id === currentUser.id)
    : false

  const currentUserEntry = currentUser
    ? displayData.find((e) => e.id === currentUser.id)
    : null

  // Reigning Monarch defaults to global #1, or fallback to Sung Jin-Woo
  const reigningMonarch = (leaderboard[0] || initialLeaderboard[0]) ? {
    username: (leaderboard[0] || initialLeaderboard[0]).username,
    level: (leaderboard[0] || initialLeaderboard[0]).level,
    xp: (leaderboard[0] || initialLeaderboard[0]).xp,
    rank: (leaderboard[0] || initialLeaderboard[0]).rank,
  } : {
    username: "SUNG JIN-WOO",
    level: 99,
    xp: 25480,
    rank: "SSS" as const,
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="border-b"
        style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(8,8,15,0.8)' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-exo2 font-black tracking-widest uppercase"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            VICTARC
          </Link>
          {currentUser ? (
            <Link
              href="/dashboard"
              className="text-xs font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
            >
              → Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-xs font-exo2 font-bold uppercase tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                color: '#fff',
              }}
            >
              Join Now
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8 flex flex-col items-center">
          <h1
            className="text-4xl md:text-5xl font-exo2 font-black uppercase mb-2"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.3))',
            }}
          >
            🏆 Global Rankings
          </h1>
          <p className="text-muted-foreground font-rajdhani mb-4">
            {leaderboard.length} hunters competing worldwide
          </p>

          {/* Shadow Monarch Throne Room Button */}
          <button
            onClick={() => setShowThroneRoom(true)}
            className="monarch-btn-pulse relative px-6 py-2.5 rounded-lg text-xs font-exo2 font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 overflow-hidden border border-purple-500/40 text-white"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes button-glow-pulse {
                0%, 100% { box-shadow: 0 0 15px rgba(124, 58, 237, 0.4), 0 0 5px rgba(6, 182, 212, 0.1); }
                50% { box-shadow: 0 0 25px rgba(124, 58, 237, 0.7), 0 0 15px rgba(6, 182, 212, 0.4); }
              }
              .monarch-btn-pulse {
                animation: button-glow-pulse 2s infinite alternate ease-in-out;
              }
            `}} />
            👑 This Month&apos;s Shadow Monarch
          </button>
        </div>

        {/* Time filter */}
        <div className="flex gap-2 justify-center mb-8">
          {(['alltime', 'week'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              id={`leaderboard-filter-${f}`}
              onClick={() => setTimeFilter(f)}
              className="px-5 py-2 rounded-lg text-xs font-exo2 font-bold uppercase tracking-widest transition-all duration-200"
              style={{
                background: timeFilter === f ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.05)',
                border: `1px solid ${timeFilter === f ? 'rgba(124,58,237,0.6)' : 'rgba(124,58,237,0.15)'}`,
                color: timeFilter === f ? '#a78bfa' : 'var(--text-muted)',
              }}
            >
              {f === 'alltime' ? '📊 All Time' : '📅 This Week'}
            </button>
          ))}
        </div>

        {/* Podium */}
        {displayData.length >= 3 && timeFilter === 'alltime' && (
          <TopThreePodium entries={displayData} currentUserId={currentUser?.id} />
        )}

        {/* Leaderboard list */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          {/* Table header */}
          <div
            className="flex items-center gap-4 px-4 py-3 border-b text-xs font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}
          >
            <div className="w-8">Pos</div>
            <div className="w-9" />
            <div className="flex-1">Hunter</div>
            <div className="hidden sm:block">Rank</div>
            <div className="w-20 text-right">XP</div>
          </div>

          {/* Rows */}
          {loadingWeekly ? (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
              {[...Array(10)].map((_, i) => (
                <LeaderboardRowSkeleton key={i} />
              ))}
            </div>
          ) : displayData.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">🕳️</p>
              <p className="font-exo2 font-bold uppercase text-muted-foreground">
                No data for this period
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
              {displayData.slice(0, 20).map((entry, i) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  index={i}
                  isCurrentUser={currentUser?.id === entry.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Current user sticky row (if not in top 20) */}
        {!currentUserInTop && currentUserEntry && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground font-rajdhani text-center mb-2">
              ↓ Your Position
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: '1px solid rgba(124,58,237,0.4)',
                background: 'rgba(124,58,237,0.05)',
              }}
            >
              <LeaderboardRow
                entry={currentUserEntry}
                index={0}
                isCurrentUser
              />
            </div>
          </div>
        )}

        {/* Realtime indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#86efac' }}
          />
          <span className="text-xs text-muted-foreground font-rajdhani">Live updates enabled</span>
        </div>
      </div>

      {/* Throne Room Overlay */}
      {showThroneRoom && (
        <div className="fixed inset-0 z-50 bg-[#030308] overflow-hidden flex flex-col items-center justify-between font-rajdhani select-none">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes stage-rumble {
              0%, 100% { transform: translate(0, 0) scale(1); }
              10% { transform: translate(-3px, -3px) scale(1.01); }
              20% { transform: translate(3px, 1px) scale(1.02); }
              30% { transform: translate(-2px, 3px) scale(1.01); }
              40% { transform: translate(2px, -2px) scale(1.03); }
              50% { transform: translate(-3px, 2px) scale(1.02); }
              60% { transform: translate(3px, 3px) scale(1.01); }
              70% { transform: translate(-2px, -2px) scale(1.03); }
              80% { transform: translate(2px, 3px) scale(1.02); }
              90% { transform: translate(-3px, -3px) scale(1.01); }
            }

            @keyframes energy-pulse {
              0% { opacity: 0.35; }
              100% { opacity: 0.85; }
            }

            @keyframes floating-particle {
              0% {
                transform: translateY(105vh) translateX(0) scale(0.5);
                opacity: 0;
              }
              10% { opacity: 0.8; }
              90% { opacity: 0.8; }
              100% {
                transform: translateY(-5vh) translateX(var(--drift, 50px)) scale(1.2);
                opacity: 0;
              }
            }

            @keyframes banner-pop {
              0% { transform: translateY(50px) scale(0.9); opacity: 0; }
              75% { transform: translateY(-5px) scale(1.03); opacity: 1; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }

            .rumble-anim {
              animation: stage-rumble 0.45s cubic-bezier(.36,.07,.19,.97) both;
            }

            .glow-overlay {
              background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.25) 0%, transparent 85%);
              animation: energy-pulse 3s infinite alternate ease-in-out;
            }

            .vignette-overlay {
              background: radial-gradient(circle at 50% 50%, transparent 20%, rgba(0, 0, 0, 0.9) 100%);
            }

            .banner-pop-anim {
              animation: banner-pop 0.9s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            }
          `}} />

          {/* White flash layer */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-150" />
          )}

          {/* Stage Container */}
          <div className={`absolute inset-0 w-full h-full flex flex-col justify-between ${isRumbling ? 'rumble-anim' : ''}`}>
            {/* Background Throne Image */}
            <div className="absolute inset-0 w-full h-full z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/monarch_on_throne.png"
                alt="Shadow Monarch Throne Room"
                className="w-full h-full object-cover opacity-80 select-none pointer-events-none"
              />
              {/* Glow overlay */}
              <div className="absolute inset-0 glow-overlay z-10 pointer-events-none" />
              {/* Vignette overlay */}
              <div className="absolute inset-0 vignette-overlay z-20 pointer-events-none" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute rounded-full bg-cyan-400 pointer-events-none opacity-0"
                  style={{
                    left: p.left,
                    bottom: '-20px',
                    width: p.size,
                    height: p.size,
                    boxShadow: '0 0 10px rgba(6, 182, 212, 0.8), 0 0 20px rgba(139, 92, 246, 0.4)',
                    animation: `floating-particle ${p.duration} linear infinite`,
                    animationDelay: p.delay,
                    '--drift': p.drift,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            {/* Top Bar Controls */}
            <div className="relative z-40 w-full px-4 py-4 md:px-8 flex justify-between items-start select-none">
              {/* Countdown rotation info */}
              <div className="bg-black/85 border border-purple-500/35 rounded-lg px-4 py-2 shadow-2xl backdrop-blur-md">
                <div className="text-[10px] tracking-widest text-slate-400 font-bold uppercase">CROWNING ROTATION IN</div>
                <div className="font-exo2 font-extrabold text-[#fbbf24] text-xs md:text-sm tracking-wide mt-0.5">
                  {timeLeft || 'Calculating...'}
                </div>
              </div>

              {/* Exit Button */}
              <button
                onClick={() => setShowThroneRoom(false)}
                className="group relative bg-black/80 border border-red-500/40 hover:border-red-500 hover:bg-red-950/20 px-4 py-2.5 rounded-lg transition-all duration-300 backdrop-blur-md flex items-center gap-2"
                style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' }}
              >
                <span className="text-[11px] font-exo2 font-black tracking-widest text-red-400 group-hover:text-red-300">
                  ← EXIT THRONE
                </span>
              </button>
            </div>

            {/* Main title center */}
            <div className="relative z-40 text-center select-none pt-4 pointer-events-none">
              <h2 className="text-xl md:text-3xl font-exo2 font-black tracking-[0.25em] text-white/40 uppercase">
                THE MONARCH&apos;S THRONEROOM
              </h2>
              <p className="text-[10px] md:text-xs text-purple-400/30 uppercase tracking-[0.4em] mt-1">
                REIGN OF THE STRONGEST
              </p>
            </div>

            {/* Bottom Plaque Banner Card */}
            <div className="relative z-40 w-full pb-12 px-4 flex justify-center">
              {showBanner && (
                <div
                  className="banner-pop-anim text-center bg-black/95 border-2 border-[#fbbf24] hover:border-purple-400 rounded-xl px-6 py-5 w-full max-w-[440px] shadow-[0_0_35px_rgba(251,191,36,0.35)] backdrop-blur-md transition-colors duration-500"
                >
                  <div className="text-[11px] font-exo2 font-black tracking-[0.3em] text-[#fbbf24] uppercase mb-1.5 animate-pulse">
                    Reigning Shadow Monarch
                  </div>

                  <h3 className="text-2xl md:text-3xl font-exo2 font-black text-white uppercase tracking-wider mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                    {reigningMonarch.username}
                  </h3>

                  <div className="flex items-center justify-center gap-3 text-xs md:text-sm font-semibold tracking-wide text-cyan-400 font-rajdhani">
                    <span>LEVEL {reigningMonarch.level}</span>
                    <span className="text-purple-500">•</span>
                    <span>{reigningMonarch.xp.toLocaleString()} XP</span>
                    <span className="text-purple-500">•</span>
                    <span className="text-[#fbbf24] font-black">RANK {reigningMonarch.rank}</span>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-400 tracking-wider font-rajdhani italic">
                    &quot;He who has conquered all challenges sits upon the shadow throne.&quot;
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
