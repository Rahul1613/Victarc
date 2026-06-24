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
        <div className="text-center mb-8">
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
          <p className="text-muted-foreground font-rajdhani">
            {leaderboard.length} hunters competing worldwide
          </p>
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
    </div>
  )
}
