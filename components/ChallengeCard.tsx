'use client'

import { motion } from 'framer-motion'
import type { Challenge } from '@/lib/types'
import { RANK_COLORS, CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/constants'

interface ChallengeCardProps {
  challenge: Challenge
  onAccept?: (challenge: Challenge) => void
  completed?: boolean
  pending?: boolean
  index?: number
  committed?: boolean
  onCommit?: (challenge: Challenge) => void
  hasAnyCommitment?: boolean
}

export default function ChallengeCard({
  challenge,
  onAccept,
  completed = false,
  pending = false,
  index = 0,
  committed = false,
  onCommit,
  hasAnyCommitment = false,
}: ChallengeCardProps) {
  const rankColors = RANK_COLORS[challenge.difficulty]
  const categoryIcon = CATEGORY_ICONS[challenge.category]
  const categoryColor = CATEGORY_COLORS[challenge.category]
  const isBoss = challenge.is_boss_challenge

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-lg ${isBoss ? 'boss-card-border' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isBoss ? '#f59e0b' : rankColors.border}`,
        boxShadow: isBoss
          ? undefined
          : `0 0 0 rgba(0,0,0,0)`,
      }}
    >
      {/* Left accent border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{
          background: isBoss
            ? 'linear-gradient(180deg, #f59e0b, #fb923c)'
            : rankColors.text,
          boxShadow: `0 0 12px ${rankColors.glow}`,
        }}
      />

      {/* Boss badge overlay */}
      {isBoss && (
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-exo2 font-black tracking-wider"
          style={{
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.5)',
            color: '#f59e0b',
            textShadow: '0 0 10px rgba(245,158,11,0.8)',
          }}
        >
          ⚔️ BOSS
        </div>
      )}

      {/* Completed overlay */}
      {completed && (
        <div className="absolute inset-0 rounded-lg z-10 flex items-center justify-center"
          style={{ background: 'rgba(8,8,15,0.7)', backdropFilter: 'blur(2px)' }}
        >
          <span className="text-2xl font-exo2 font-black text-green-400 tracking-wider">
            ✓ COMPLETED
          </span>
        </div>
      )}

      {/* Pending overlay */}
      {pending && (
        <div className="absolute inset-0 rounded-lg z-10 flex items-center justify-center"
          style={{ background: 'rgba(8,8,15,0.7)', backdropFilter: 'blur(2px)' }}
        >
          <span className="text-xl font-exo2 font-black text-amber-400 tracking-wider">
            ⌛ PENDING APPROVAL
          </span>
        </div>
      )}

      {/* Card content */}
      <div className="p-5 pl-6">
        {/* Top row: category + difficulty */}
        <div className="flex items-center gap-2 mb-3">
          {/* Category tag */}
          <span
            className="text-xs font-rajdhani font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              color: categoryColor,
              background: `${categoryColor}18`,
              border: `1px solid ${categoryColor}30`,
            }}
          >
            {categoryIcon} {challenge.category}
          </span>

          {/* Difficulty badge */}
          <span
            className="text-xs font-exo2 font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              color: rankColors.text,
              background: rankColors.bg,
              border: `1px solid ${rankColors.border}`,
              textShadow: `0 0 8px ${rankColors.glow}`,
            }}
          >
            {challenge.difficulty}
          </span>

          {/* Duration */}
          {challenge.duration_days > 1 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {challenge.duration_days} days
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="text-lg font-exo2 font-black uppercase tracking-wide mb-2 leading-tight"
          style={{ color: isBoss ? '#f59e0b' : 'var(--text-primary)' }}
        >
          {challenge.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground font-rajdhani mb-4 leading-relaxed line-clamp-2">
          {challenge.description}
        </p>

        {/* Bottom row: XP + action */}
        <div className="flex items-center justify-between">
          {/* XP reward */}
          <div className="flex items-center gap-1.5">
            <span
              className="text-xl font-exo2 font-black"
              style={{
                color: isBoss ? '#f59e0b' : 'var(--accent-cyan)',
                textShadow: isBoss
                  ? '0 0 15px rgba(245,158,11,0.7)'
                  : '0 0 10px rgba(6,182,212,0.5)',
              }}
            >
              +{challenge.xp_reward.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">XP</span>
          </div>

          {/* Action buttons */}
          {!completed && !pending && (
            <div className="flex items-center gap-2">
              {committed ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAccept?.(challenge)}
                  className="relative px-3 py-1.5 rounded font-exo2 font-bold text-[10px] uppercase tracking-widest overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(245, 158, 11, 0.25))',
                    border: '1px solid rgba(245, 158, 11, 0.6)',
                    color: '#fbbf24',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <span className="relative z-10 flex items-center gap-1">
                    👑 Complete Quest
                  </span>
                  <motion.div
                    className="absolute inset-0 opacity-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(251, 146, 60, 0.35))',
                    }}
                    whileHover={{ opacity: 1 }}
                  />
                </motion.button>
              ) : hasAnyCommitment ? (
                <button
                  disabled
                  className="px-3 py-1.5 rounded font-exo2 font-bold text-[10px] uppercase tracking-widest border border-dashed border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                >
                  Locked
                </button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onAccept?.(challenge)}
                    className="relative px-3 py-1.5 rounded font-exo2 font-bold text-[10px] uppercase tracking-widest overflow-hidden"
                    style={{
                      background: isBoss
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.2))'
                        : 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.2))',
                      border: `1px solid ${isBoss ? 'rgba(245,158,11,0.5)' : 'rgba(124,58,237,0.5)'}`,
                      color: isBoss ? '#f59e0b' : '#a78bfa',
                    }}
                  >
                    <span className="relative z-10">Accept</span>
                    <motion.div
                      className="absolute inset-0 opacity-0"
                      style={{
                        background: isBoss
                          ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,146,60,0.15))'
                          : 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(37,99,235,0.3))',
                      }}
                      whileHover={{ opacity: 1 }}
                    />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onCommit?.(challenge)}
                    className="relative px-3 py-1.5 rounded font-exo2 font-bold text-[10px] uppercase tracking-widest overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 146, 60, 0.15))',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#f59e0b',
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-1">
                      👑 Commit
                    </span>
                    <motion.div
                      className="absolute inset-0 opacity-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(251, 146, 60, 0.35))',
                      }}
                      whileHover={{ opacity: 1 }}
                    />
                  </motion.button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
