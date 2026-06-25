'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RANKS } from '@/lib/constants'
import { RANK_COLORS } from '@/lib/constants'
import ParticleField from '@/components/ParticleField'
import RankBadge from '@/components/RankBadge'
import type { Rank } from '@/lib/types'
import VideoIntroOverlay from '@/components/VideoIntroOverlay'

const RANK_DESCRIPTIONS: Record<string, string> = {
  E: 'Beginner. The journey starts.',
  D: 'Awakened. Discipline forming.',
  C: 'Hunter. Pushing limits.',
  B: 'Elite. Consistent warrior.',
  A: 'Champion. Rare breed.',
  S: 'Shadow. Near the peak.',
  SS: 'Monarch. Feared by all.',
  SSS: 'Shadow Monarch. Legendary.',
}

export default function LandingClient() {
  const [showIntro, setShowIntro] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const hasPlayed = sessionStorage.getItem('victarc_landing_intro_played')
    if (!hasPlayed) {
      setShowIntro(true)
    }
  }, [])

  const handleIntroComplete = () => {
    sessionStorage.setItem('victarc_landing_intro_played', 'true')
    setShowIntro(false)
  }

  // Prevent hydration mismatch by rendering a simple black screen until client check is done
  if (!mounted) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <>
      {showIntro && (
        <VideoIntroOverlay src="/starting.mp4" onComplete={handleIntroComplete} />
      )}

      <main className="min-h-screen overflow-hidden">
        {/* ===================== HERO SECTION ===================== */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center text-center px-4"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%), var(--bg-primary)',
          }}
        >
          {/* Particle field */}
          <ParticleField />

          {/* Grid overlay */}
          <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

          {/* Scan line effect */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background:
                  'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)',
                animation: 'scan-line 6s linear infinite',
              }}
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            {/* Top badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-rajdhani font-semibold uppercase tracking-widest mb-2"
              style={{
                border: '1px solid rgba(124,58,237,0.4)',
                background: 'rgba(124,58,237,0.08)',
                color: '#a78bfa',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#7c3aed' }}
              />
              Solo Levelling Fitness Platform
            </div>

            {/* Main headline */}
            <h1
              className="text-5xl sm:text-7xl md:text-8xl font-exo2 font-black uppercase"
              style={{
                letterSpacing: '0.04em',
                lineHeight: '1',
              }}
            >
              <span
                className="block"
                style={{
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #a78bfa 50%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.4))',
                }}
              >
                ARISE.
              </span>
              <span
                className="block"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                COMPLETE.
              </span>
              <span
                className="block"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #fbbf24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.3))',
                }}
              >
                DOMINATE.
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg md:text-xl font-rajdhani max-w-2xl mx-auto"
              style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}
            >
              Daily fitness and self-growth challenges. Earn XP, level up your rank, and compete on
              the global leaderboard.{' '}
              <span style={{ color: '#a78bfa' }}>Become the Shadow Monarch.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/login"
                id="cta-start-journey"
                className="relative inline-flex items-center justify-center px-8 py-4 rounded-lg font-exo2 font-black text-sm uppercase tracking-widest overflow-hidden group transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.2)',
                }}
              >
                <span className="relative z-10">⚡ Start Your Journey</span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, #9d5cf0, #3b82f6)' }}
                />
              </Link>

              <Link
                href="/leaderboard"
                id="cta-view-leaderboard"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-exo2 font-black text-sm uppercase tracking-widest transition-all duration-300 cta-outline-btn"
                style={{
                  border: '1px solid rgba(124,58,237,0.5)',
                  color: '#a78bfa',
                  background: 'rgba(124,58,237,0.05)',
                }}
              >
                🏆 View Leaderboard
              </Link>
            </div>

            {/* Stats preview */}
            <div className="flex justify-center gap-8 pt-8">
              {[
                { value: '10+', label: 'Active Challenges' },
                { value: 'E→SSS', label: 'Rank System' },
                { value: '∞', label: 'XP to Earn' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="text-2xl font-exo2 font-black"
                    style={{ color: 'var(--accent-cyan)' }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float"
            aria-hidden="true"
          >
            <span className="text-xs font-rajdhani text-muted-foreground uppercase tracking-widest">
              Scroll
            </span>
            <div
              className="w-px h-8"
              style={{ background: 'linear-gradient(180deg, rgba(124,58,237,0.8), transparent)' }}
            />
          </div>
        </section>

        {/* ===================== RANK PREVIEW SECTION ===================== */}
        <section
          className="py-20 px-4"
          style={{
            background:
              'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)',
          }}
        >
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-12">
              <h2
                className="text-3xl md:text-4xl font-exo2 font-black uppercase mb-3"
                style={{
                  background: 'linear-gradient(135deg, #e2e8f0, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                The Rank System
              </h2>
              <p className="text-muted-foreground font-rajdhani max-w-lg mx-auto">
                Earn XP by completing challenges. Cross the threshold to rank up and unlock your
                true power.
              </p>
            </div>

            {/* Rank cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {RANKS.map((rank) => {
                const colors = RANK_COLORS[rank]
                return (
                  <div
                    key={rank}
                    className="flex flex-col items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:scale-105"
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      boxShadow: `0 0 15px ${colors.glow}`,
                    }}
                  >
                    <RankBadge rank={rank as Rank} size="lg" />
                    <div className="text-center">
                      <div
                        className="text-xs font-exo2 font-black uppercase"
                        style={{ color: colors.text }}
                      >
                        Rank {rank}
                      </div>
                      <div
                        className="text-xs font-rajdhani mt-1 leading-tight"
                        style={{ color: 'var(--text-muted)', fontSize: '10px' }}
                      >
                        {RANK_DESCRIPTIONS[rank]}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===================== HOW IT WORKS ===================== */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-3xl md:text-4xl font-exo2 font-black uppercase mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                How It Works
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  icon: '⚡',
                  title: 'Accept a Challenge',
                  desc: 'Choose from fitness, mindset, discipline, and nutrition challenges. Each has a difficulty rank and XP reward.',
                  color: 'var(--accent-purple)',
                },
                {
                  step: '02',
                  icon: '💪',
                  title: 'Complete & Prove It',
                  desc: 'Do the challenge. Submit your proof with a quick note. XP is instantly awarded to your profile.',
                  color: 'var(--accent-cyan)',
                },
                {
                  step: '03',
                  icon: '🏆',
                  title: 'Rank Up',
                  desc: 'Cross XP thresholds to rank up from E to SSS. Climb the global leaderboard. Become the Shadow Monarch.',
                  color: 'var(--accent-gold)',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-6 rounded-xl"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(124,58,237,0.15)',
                  }}
                >
                  <div
                    className="text-4xl font-exo2 font-black mb-3 opacity-20"
                    style={{ color: item.color }}
                  >
                    {item.step}
                  </div>
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h3
                    className="text-lg font-exo2 font-black uppercase mb-2"
                    style={{ color: item.color }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm font-rajdhani text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== FINAL CTA ===================== */}
        <section
          className="py-20 px-4 text-center"
          style={{
            background:
              'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        >
          <div className="max-w-2xl mx-auto space-y-6">
            <h2
              className="text-4xl md:text-5xl font-exo2 font-black uppercase"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Ready to Arise?
            </h2>
            <p className="text-muted-foreground font-rajdhani text-lg">
              Your journey to becoming the Shadow Monarch begins with a single challenge.
            </p>
            <Link
              href="/login"
              id="cta-bottom-start"
              className="inline-flex items-center justify-center px-10 py-4 rounded-lg font-exo2 font-black text-sm uppercase tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                color: '#ffffff',
                boxShadow: '0 0 40px rgba(124,58,237,0.4)',
              }}
            >
              Begin Your Ascent →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="py-6 text-center border-t"
          style={{ borderColor: 'rgba(124,58,237,0.1)' }}
        >
          <p className="text-xs text-muted-foreground font-rajdhani uppercase tracking-widest">
            VICTARC © 2024 · Arise. Complete. Dominate.
          </p>
        </footer>
      </main>
    </>
  )
}
