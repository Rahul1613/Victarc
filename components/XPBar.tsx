'use client'

import { motion } from 'framer-motion'
import { xpToNextRank } from '@/lib/xp'

interface XPBarProps {
  xp: number
  compact?: boolean
}

export default function XPBar({ xp, compact = false }: XPBarProps) {
  const progress = xpToNextRank(xp)

  return (
    <div className={`w-full ${compact ? '' : 'space-y-2'}`}>
      {!compact && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground font-rajdhani tracking-wider uppercase">
            Rank {progress.currentRank}
          </span>
          {progress.nextRank ? (
            <span className="text-xs text-muted-foreground font-rajdhani">
              <span className="text-accent-cyan font-semibold">
                {progress.currentXP.toLocaleString()}
              </span>
              <span className="text-muted-foreground mx-1">/</span>
              <span>{progress.nextThreshold.toLocaleString()} XP</span>
            </span>
          ) : (
            <span className="text-xs font-semibold" style={{ color: '#c084fc' }}>
              MAX RANK
            </span>
          )}
        </div>
      )}

      {/* Bar container */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: compact ? '4px' : '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}
      >
        {/* Animated fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #06b6d4, #7c3aed)',
            boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      {compact && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">Rank {progress.currentRank}</span>
          <span className="text-xs text-accent-cyan">{progress.percentage}%</span>
        </div>
      )}
    </div>
  )
}
