import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Challenge } from '@/lib/types'
import { RANK_COLORS, CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/constants'
import RankBadge from '@/components/RankBadge'
import Link from 'next/link'

interface ChallengePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: challenge } = await supabase
    .from('challenges')
    .select('title, description')
    .eq('id', id)
    .single()

  return {
    title: challenge?.title ?? 'Challenge',
    description: challenge?.description ?? 'Complete this VICTARC challenge to earn XP.',
  }
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single()

  if (!challenge) notFound()

  const c = challenge as Challenge
  const rankColors = RANK_COLORS[c.difficulty]
  const categoryIcon = CATEGORY_ICONS[c.category]
  const categoryColor = CATEGORY_COLORS[c.category]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="border-b"
        style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(8,8,15,0.8)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
          >
            ← Challenges
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

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Challenge hero */}
        <div
          className="relative rounded-2xl overflow-hidden p-8 mb-8"
          style={{
            background: c.is_boss_challenge
              ? 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(245,158,11,0.15) 0%, var(--bg-card) 70%)'
              : `radial-gradient(ellipse 80% 100% at 50% 0%, ${rankColors.glow} 0%, var(--bg-card) 70%)`,
            border: `1px solid ${c.is_boss_challenge ? '#f59e0b' : rankColors.border}`,
            boxShadow: c.is_boss_challenge
              ? '0 0 40px rgba(245,158,11,0.2)'
              : `0 0 30px ${rankColors.glow}`,
          }}
        >
          {c.is_boss_challenge && (
            <div
              className="absolute top-4 right-4 px-3 py-1 rounded font-exo2 font-black text-xs uppercase tracking-wider"
              style={{
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.5)',
                color: '#f59e0b',
              }}
            >
              ⚔️ BOSS CHALLENGE
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="text-xs font-rajdhani font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{
                color: categoryColor,
                background: `${categoryColor}18`,
                border: `1px solid ${categoryColor}30`,
              }}
            >
              {categoryIcon} {c.category}
            </span>
            <RankBadge rank={c.difficulty} size="md" />
          </div>

          <h1
            className="text-3xl md:text-4xl font-exo2 font-black uppercase mb-4"
            style={{ color: c.is_boss_challenge ? '#f59e0b' : 'var(--text-primary)' }}
          >
            {c.title}
          </h1>

          <p className="text-base font-rajdhani text-muted-foreground leading-relaxed mb-6">
            {c.description}
          </p>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">XP Reward</div>
              <div
                className="text-2xl font-exo2 font-black mt-1"
                style={{
                  color: c.is_boss_challenge ? '#f59e0b' : 'var(--accent-cyan)',
                  textShadow: c.is_boss_challenge
                    ? '0 0 15px rgba(245,158,11,0.7)'
                    : '0 0 10px rgba(6,182,212,0.5)',
                }}
              >
                +{c.xp_reward.toLocaleString()} XP
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">Duration</div>
              <div className="text-2xl font-exo2 font-black mt-1" style={{ color: 'var(--text-primary)' }}>
                {c.duration_days} {c.duration_days === 1 ? 'day' : 'days'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider">Difficulty</div>
              <div
                className="text-2xl font-exo2 font-black mt-1"
                style={{ color: rankColors.text }}
              >
                Rank {c.difficulty}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/dashboard"
            id="challenge-accept-cta"
            className="inline-flex items-center justify-center px-10 py-4 rounded-lg font-exo2 font-black text-sm uppercase tracking-widest"
            style={{
              background: c.is_boss_challenge
                ? 'linear-gradient(135deg, #f59e0b, #fb923c)'
                : 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: '#ffffff',
              boxShadow: c.is_boss_challenge
                ? '0 0 30px rgba(245,158,11,0.4)'
                : '0 0 30px rgba(124,58,237,0.4)',
            }}
          >
            ⚡ Accept Challenge →
          </Link>
          <p className="text-xs text-muted-foreground font-rajdhani mt-3">
            Complete from your dashboard after accepting
          </p>
        </div>
      </div>
    </div>
  )
}
