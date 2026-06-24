'use client'

export function ChallengeCardSkeleton() {
  return (
    <div
      className="rounded-lg overflow-hidden animate-pulse"
      style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="flex">
        <div className="w-1 bg-white/10" />
        <div className="p-5 flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-full bg-white/8" />
            <div className="h-5 w-8 rounded bg-white/8" />
          </div>
          <div className="h-5 w-2/3 rounded bg-white/8" />
          <div className="h-3 w-full rounded bg-white/5" />
          <div className="h-3 w-3/4 rounded bg-white/5" />
          <div className="flex justify-between items-center pt-1">
            <div className="h-6 w-16 rounded bg-white/8" />
            <div className="h-8 w-32 rounded bg-white/8" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function LeaderboardRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg animate-pulse"
      style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="w-8 h-5 rounded bg-white/8" />
      <div className="w-9 h-9 rounded-full bg-white/8" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-white/8" />
        <div className="h-3 w-20 rounded bg-white/5" />
      </div>
      <div className="w-10 h-10 rounded bg-white/8" />
      <div className="w-20 space-y-1">
        <div className="h-4 rounded bg-white/8" />
        <div className="h-3 rounded bg-white/5" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 rounded-xl bg-white/5" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  )
}
