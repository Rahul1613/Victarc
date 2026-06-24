'use client'

import { RANK_COLORS } from '@/lib/constants'
import type { Rank } from '@/lib/types'

interface RankBadgeProps {
  rank: Rank
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
}

const SIZE_CLASSES = {
  sm: { outer: 'w-8 h-8', text: 'text-xs', fontSize: '10px' },
  md: { outer: 'w-10 h-10', text: 'text-sm', fontSize: '12px' },
  lg: { outer: 'w-14 h-14', text: 'text-lg', fontSize: '16px' },
  xl: { outer: 'w-20 h-20', text: 'text-2xl', fontSize: '22px' },
}

export default function RankBadge({ rank, size = 'md', animated = false }: RankBadgeProps) {
  const colors = RANK_COLORS[rank]
  const sizes = SIZE_CLASSES[size]

  const isMultiChar = rank.length > 1

  return (
    <div
      className={`relative inline-flex items-center justify-center ${sizes.outer} select-none`}
      style={{
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg})`,
        border: `2px solid ${colors.border}`,
        boxShadow: animated
          ? `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`
          : `0 0 8px ${colors.glow}`,
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Inner hexagon background */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: `radial-gradient(circle at center, ${colors.bg} 0%, transparent 100%)`,
        }}
      />

      {/* Rank text */}
      <span
        className={`relative z-10 font-exo2 font-black ${sizes.text} tracking-tight`}
        style={{
          color: colors.text,
          textShadow: `0 0 10px ${colors.glow}`,
          fontSize: isMultiChar ? `calc(${sizes.fontSize} * 0.75)` : sizes.fontSize,
          letterSpacing: isMultiChar ? '-0.05em' : '0',
        }}
      >
        {rank}
      </span>
    </div>
  )
}
