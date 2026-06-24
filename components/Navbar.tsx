'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { User } from '@/lib/types'
import { RANK_COLORS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import XPBar from './XPBar'
import RankBadge from './RankBadge'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  user: User
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const router = useRouter()
  const rankColors = RANK_COLORS[user.rank]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(8,8,15,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(124,58,237,0.15)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div
              className="text-2xl font-exo2 font-black tracking-widest uppercase"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.6))',
              }}
            >
              VICTARC
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
            >
              Challenges
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
            >
              Leaderboard
            </Link>
            {user.is_admin && (
              <Link
                href="/admin"
                className="text-sm font-rajdhani font-semibold uppercase tracking-wider text-accent-purple hover:text-purple-400 transition-colors"
              >
                Admin Panel
              </Link>
            )}
          </div>

          {/* Right side: XP bar + rank + avatar */}
          <div className="hidden md:flex items-center gap-4">
            {/* XP bar */}
            <div className="w-36">
              <XPBar xp={user.xp} compact />
            </div>

            {/* Rank badge */}
            <RankBadge rank={user.rank} size="sm" />

            {/* XP number */}
            <span
              className="text-sm font-exo2 font-bold"
              style={{ color: 'var(--accent-cyan)' }}
            >
              {user.xp.toLocaleString()} XP
            </span>

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-exo2 font-black text-sm transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${rankColors.border}, ${rankColors.text}30)`,
                  border: `2px solid ${rankColors.border}`,
                  boxShadow: `0 0 10px ${rankColors.glow}`,
                  color: rankColors.text,
                }}
              >
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={36}
                    height={36}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(user.username)
                )}
              </button>

              {/* Dropdown */}
              {avatarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-12 w-48 rounded-lg overflow-hidden z-50"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                  onMouseLeave={() => setAvatarOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs font-exo2 font-bold uppercase tracking-wider"
                      style={{ color: rankColors.text }}>
                      {user.username}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  </div>
                  <Link
                    href={`/profile/${user.username}`}
                    className="block px-4 py-2 text-sm font-rajdhani text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => setAvatarOpen(false)}
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm font-rajdhani text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
              style={{ background: 'var(--accent-purple)' }}
            />
            <span
              className={`block w-6 h-0.5 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}
              style={{ background: 'var(--accent-purple)' }}
            />
            <span
              className={`block w-6 h-0.5 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              style={{ background: 'var(--accent-purple)' }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t"
          style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'var(--bg-secondary)' }}
        >
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-exo2 font-black"
                style={{
                  background: `linear-gradient(135deg, ${rankColors.border}, ${rankColors.text}30)`,
                  border: `2px solid ${rankColors.border}`,
                  color: rankColors.text,
                }}
              >
                {getInitials(user.username)}
              </div>
              <div>
                <p className="font-exo2 font-bold text-sm uppercase" style={{ color: rankColors.text }}>
                  {user.username}
                </p>
                <p className="text-xs text-muted-foreground">{user.xp.toLocaleString()} XP</p>
              </div>
              <RankBadge rank={user.rank} size="sm" />
            </div>
            <Link
              href="/dashboard"
              className="block py-2 font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              Challenges
            </Link>
            <Link
              href="/leaderboard"
              className="block py-2 font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href={`/profile/${user.username}`}
              className="block py-2 font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            {user.is_admin && (
              <Link
                href="/admin"
                className="block py-2 font-rajdhani font-semibold uppercase tracking-wider text-accent-purple hover:text-purple-400"
                onClick={() => setMenuOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="block w-full text-left py-2 font-rajdhani font-semibold uppercase tracking-wider text-red-400 hover:text-red-300"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  )
}
