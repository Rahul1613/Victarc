'use client'

import { motion } from 'framer-motion'
import type { LeaderboardEntry } from '@/lib/types'
import { RANK_COLORS } from '@/lib/constants'
import RankBadge from './RankBadge'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  index: number
  isCurrentUser?: boolean
}

const MEDAL_STYLES: Record<number, { color: string; glow: string; label: string }> = {
  1: { color: '#fbbf24', glow: 'rgba(251,191,36,0.4)', label: '🥇' },
  2: { color: '#94a3b8', glow: 'rgba(148,163,184,0.3)', label: '🥈' },
  3: { color: '#fb923c', glow: 'rgba(251,146,60,0.35)', label: '🥉' },
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

export default function LeaderboardRow({ entry, index, isCurrentUser = false }: LeaderboardRowProps) {
  const position = Number(entry.position)
  const medal = MEDAL_STYLES[position]
  const rankColors = RANK_COLORS[entry.rank]

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className={`relative flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
        isCurrentUser ? 'ring-1 ring-accent-purple/50' : ''
      }`}
      style={{
        background: isCurrentUser
          ? 'rgba(124,58,237,0.08)'
          : medal
          ? `rgba(${position === 1 ? '251,191,36' : position === 2 ? '148,163,184' : '251,146,60'},0.05)`
          : 'var(--bg-card)',
        border: `1px solid ${
          isCurrentUser
            ? 'rgba(124,58,237,0.3)'
            : medal
            ? medal.color + '30'
            : 'rgba(255,255,255,0.04)'
        }`,
        boxShadow: medal ? `0 0 15px ${medal.glow}` : undefined,
      }}
    >
      {/* Position number */}
      <div className="w-8 flex-shrink-0 text-center">
        {medal ? (
          <span className="text-xl">{medal.label}</span>
        ) : (
          <span
            className="text-sm font-exo2 font-bold"
            style={{ color: 'var(--text-muted)' }}
          >
            #{position}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-exo2 font-black text-sm"
        style={{
          background: entry.avatar_url
            ? undefined
            : `linear-gradient(135deg, ${rankColors.border}, ${rankColors.text}30)`,
          border: `2px solid ${rankColors.border}`,
          boxShadow: `0 0 8px ${rankColors.glow}`,
          backgroundImage: entry.avatar_url ? `url(${entry.avatar_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: rankColors.text,
        }}
      >
        {!entry.avatar_url && getInitials(entry.username)}
      </div>

      {/* Username + rank */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-exo2 font-bold text-sm uppercase tracking-wide truncate"
            style={{ color: isCurrentUser ? '#a78bfa' : 'var(--text-primary)' }}
          >
            {entry.username}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-accent-purple/70 font-rajdhani">(you)</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground font-rajdhani">
            Lv. {entry.level}
          </span>
          <span className="text-muted-foreground/30 text-xs">·</span>
          <span className="text-xs text-muted-foreground font-rajdhani">
            {Number(entry.total_completions)} challenges
          </span>
        </div>
      </div>

      {/* Streak */}
      {entry.streak > 3 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-base">🔥</span>
          <span className="text-xs font-exo2 font-bold text-orange-400">{entry.streak}</span>
        </div>
      )}

      {/* Rank badge */}
      <div className="flex-shrink-0">
        <RankBadge rank={entry.rank} size="sm" />
      </div>

      {/* XP */}
      <div className="flex-shrink-0 text-right min-w-[80px]">
        <div
          className="text-sm font-exo2 font-black"
          style={{
            color: medal ? medal.color : 'var(--accent-cyan)',
            textShadow: medal ? `0 0 10px ${medal.glow}` : undefined,
          }}
        >
          {Number(entry.xp).toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">XP</div>
      </div>
    </motion.div>
  )
}
