'use client'

interface StatsCardProps {
  label: string
  value: string | number
  icon: string
  color?: string
  subtitle?: string
}

export default function StatsCard({ label, value, icon, color = 'var(--accent-cyan)', subtitle }: StatsCardProps) {
  return (
    <div
      className="p-4 rounded-lg space-y-2 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(124,58,237,0.15)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground font-rajdhani">{subtitle}</span>
        )}
      </div>
      <div
        className="text-2xl font-exo2 font-black"
        style={{ color, textShadow: `0 0 15px ${color}60` }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}
