import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { User, Completion } from '@/lib/types'
import { RANK_COLORS } from '@/lib/constants'
import RankBadge from '@/components/RankBadge'
import XPBar from '@/components/XPBar'
import StatsCard from '@/components/StatsCard'
import Link from 'next/link'
import ShareButton from './ShareButton'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username}'s Profile`,
    description: `View ${username}'s VICTARC challenge stats and completed challenges.`,
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Fetch user by username
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (!user) notFound()

  // Fetch completions with challenge details
  const { data: completions } = await supabase
    .from('completions')
    .select('*, challenge:challenges(*)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(20)

  // Get global rank from leaderboard view
  const { data: rankData } = await supabase
    .from('leaderboard')
    .select('position')
    .eq('id', user.id)
    .single()

  const globalRank = rankData?.position ?? null
  const rankColors = RANK_COLORS[user.rank]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Back navigation */}
      <div
        className="border-b"
        style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(8,8,15,0.8)' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="text-xs font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
          >
            ← Leaderboard
          </Link>
          <Link
            href="/"
            className="text-xl font-exo2 font-black tracking-widest uppercase ml-auto"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            VICTARC
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ===================== HERO SECTION ===================== */}
        <div
          className="relative rounded-2xl overflow-hidden mb-8 p-8"
          style={{
            background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${rankColors.glow.replace('0.', '0.4 ')} 0%, var(--bg-card) 70%)`,
            border: `1px solid ${rankColors.border}`,
            boxShadow: `0 0 40px ${rankColors.glow}`,
          }}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center font-exo2 font-black text-3xl flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${rankColors.border}, ${rankColors.text}30)`,
                border: `4px solid ${rankColors.text}`,
                boxShadow: `0 0 30px ${rankColors.glow}`,
                color: rankColors.text,
              }}
            >
              {(user as User).username.slice(0, 2).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1
                  className="text-3xl font-exo2 font-black uppercase"
                  style={{ color: rankColors.text, textShadow: `0 0 20px ${rankColors.glow}` }}
                >
                  {(user as User).username}
                </h1>
                <RankBadge rank={(user as User).rank} size="md" animated />
              </div>

              <p className="text-sm text-muted-foreground font-rajdhani mb-4">
                Hunter since {new Date((user as User).created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>

              {/* XP bar */}
              <div className="max-w-xs mx-auto sm:mx-0">
                <XPBar xp={(user as User).xp} />
              </div>
            </div>

            {/* Global rank badge */}
            {globalRank && (
              <div className="text-center">
                <div
                  className="text-4xl font-exo2 font-black"
                  style={{ color: 'var(--accent-gold)', textShadow: '0 0 20px rgba(245,158,11,0.6)' }}
                >
                  #{globalRank}
                </div>
                <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">
                  Global
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================== STATS GRID ===================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            label="Total XP"
            value={(user as User).xp}
            icon="⚡"
            color="var(--accent-cyan)"
          />
          <StatsCard
            label="Challenges Done"
            value={completions?.length ?? 0}
            icon="✅"
            color="#86efac"
          />
          <StatsCard
            label="Best Streak"
            value={`${(user as User).streak}d`}
            icon="🔥"
            color="#fb923c"
          />
          <StatsCard
            label="Global Rank"
            value={globalRank ? `#${globalRank}` : 'N/A'}
            icon="🏆"
            color="var(--accent-gold)"
          />
        </div>

        {/* ===================== COMPLETED CHALLENGES ===================== */}
        <div>
          <h2
            className="text-xl font-exo2 font-black uppercase mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Recent Completions
          </h2>

          {completions && completions.length > 0 ? (
            <div className="space-y-3">
              {completions.map((c) => {
                const completion = c as Completion & { challenge: { title: string; difficulty: string; xp_reward: number } }
                const cRankColors = RANK_COLORS[completion.challenge?.difficulty ?? 'E']

                return (
                  <div
                    key={completion.id}
                    className="flex items-center gap-4 p-4 rounded-lg transition-colors"
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${cRankColors.border}30`,
                    }}
                  >
                    {/* Difficulty indicator */}
                    <div
                      className="w-1 h-10 rounded-full flex-shrink-0"
                      style={{ background: cRankColors.text }}
                    />

                    {/* Challenge info */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-exo2 font-bold text-sm uppercase truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {completion.challenge?.title ?? 'Unknown Challenge'}
                      </div>
                      <div className="text-xs text-muted-foreground font-rajdhani mt-0.5">
                        {new Date(completion.completed_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* XP earned */}
                    <div
                      className="text-sm font-exo2 font-black flex-shrink-0"
                      style={{ color: 'var(--accent-cyan)' }}
                    >
                      +{completion.xp_earned} XP
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">🕳️</p>
              <p className="font-exo2 font-bold uppercase text-muted-foreground">
                No completions yet
              </p>
            </div>
          )}
        </div>

        {/* Share button */}
        <div className="mt-8 text-center">
          <ShareButton username={(user as User).username} />
        </div>
      </div>
    </div>
  )
}
