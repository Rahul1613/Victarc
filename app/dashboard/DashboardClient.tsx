'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { User, Challenge, Rank, CommittedQuest, PenaltyQuest } from '@/lib/types'
import type { Category } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { RANK_COLORS } from '@/lib/constants'
import Navbar from '@/components/Navbar'
import ChallengeCard from '@/components/ChallengeCard'
import XPBar from '@/components/XPBar'
import RankBadge from '@/components/RankBadge'
import StatsCard from '@/components/StatsCard'
import RankUpOverlay from '@/components/RankUpOverlay'

type FilterTab = 'all' | Category | 'boss'

interface DashboardClientProps {
  user: User
  challenges: Challenge[]
  completedIds: string[]
  pendingIds: string[]
  activeCommit: CommittedQuest | null
  activePenalty: PenaltyQuest | null
}

export default function DashboardClient({
  user: initialUser,
  challenges,
  completedIds: initialCompletedIds,
  pendingIds: initialPendingIds,
  activeCommit: initialActiveCommit,
  activePenalty: initialActivePenalty,
}: DashboardClientProps) {
  const user = initialUser
  const completedIds = new Set(initialCompletedIds)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set(initialPendingIds))

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [proofText, setProofText] = useState('')
  const [proofImageFile, setProofImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [rankUpInfo, setRankUpInfo] = useState<{ show: boolean; newRank: Rank; oldRank: Rank }>({
    show: false,
    newRank: 'E',
    oldRank: 'E',
  })
  const [xpAnimation] = useState<{ show: boolean; amount: number }>({
    show: false,
    amount: 0,
  })
  const [activeCommitState, setActiveCommitState] = useState<CommittedQuest | null>(initialActiveCommit)
  const [activePenaltyState, setActivePenaltyState] = useState<PenaltyQuest | null>(initialActivePenalty)

  const supabase = createClient()

  const FILTERS: { key: FilterTab; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '⚡' },
    { key: 'fitness', label: 'Fitness', icon: '💪' },
    { key: 'mindset', label: 'Mindset', icon: '🧠' },
    { key: 'discipline', label: 'Discipline', icon: '🔥' },
    { key: 'nutrition', label: 'Nutrition', icon: '💧' },
    { key: 'boss', label: 'Boss', icon: '⚔️' },
  ]

  const filteredChallenges = challenges.filter((c) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'boss') return c.is_boss_challenge
    return c.category === activeFilter
  })

  async function handleSubmitCompletion() {
    if (!selectedChallenge) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      let proofImageUrl = null

      // Upload proof photo to storage bucket if selected
      if (proofImageFile) {
        const fileExt = proofImageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('proofs')
          .upload(fileName, proofImageFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error('Failed to upload image proof. Please verify that a public bucket named "proofs" is created in Supabase.')
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('proofs')
          .getPublicUrl(fileName)
        proofImageUrl = publicUrl
      }

      // Insert completion record with status: pending and image URL
      const { error: completionError } = await supabase.from('completions').insert({
        user_id: user.id,
        challenge_id: selectedChallenge.id,
        proof_text: proofText || null,
        proof_image_url: proofImageUrl,
        xp_earned: selectedChallenge.xp_reward,
        status: 'pending',
      })

      if (completionError) throw completionError

      // If this challenge is the committed quest, mark it as completed
      if (activeCommitState && activeCommitState.challenge_id === selectedChallenge.id) {
        await supabase
          .from('committed_quests')
          .update({ status: 'completed' })
          .eq('id', activeCommitState.id)
        setActiveCommitState(null)
      }

      // Update local state to mark this quest as pending
      setPendingIds((prev) => new Set(prev).add(selectedChallenge.id))

      setSelectedChallenge(null)
      setProofText('')
      setProofImageFile(null)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit completion')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCommitQuest(challenge: Challenge) {
    try {
      const expiresAt = new Date()
      expiresAt.setHours(23, 59, 59, 999)

      const { data: newCommit, error } = await supabase
        .from('committed_quests')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select('*, challenges(*)')
        .single()

      if (error) throw error

      if (newCommit) {
        setActiveCommitState(newCommit as unknown as CommittedQuest)
      }
    } catch (err) {
      console.error('Error committing quest:', err)
      alert('Failed to commit challenge. Please ensure the penalty system tables exist in your Supabase database.')
    }
  }

  async function handleClearPenalty() {
    if (!activePenaltyState) return
    try {
      const { error } = await supabase
        .from('penalty_quests')
        .update({ status: 'completed' })
        .eq('id', activePenaltyState.id)

      if (error) throw error

      setActivePenaltyState(null)
    } catch (err) {
      console.error('Error clearing penalty:', err)
      alert('Failed to log penalty completion. Please try again.')
    }
  }

  const rankColors = RANK_COLORS[user.rank]

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar user={user} />

        {/* XP float animation */}
        <AnimatePresence>
          {xpAnimation.show && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -60 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8 }}
              className="fixed top-20 right-8 z-50 font-exo2 font-black text-2xl pointer-events-none"
              style={{
                color: 'var(--accent-cyan)',
                textShadow: '0 0 20px rgba(6,182,212,0.8)',
              }}
            >
              +{xpAnimation.amount} XP ⚡
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ===================== SIDEBAR ===================== */}
            <aside className="lg:w-72 flex-shrink-0 space-y-4">
              {/* User card */}
              <div
                className="p-5 rounded-xl"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${rankColors.border}`,
                  boxShadow: `0 0 20px ${rankColors.glow}`,
                }}
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-exo2 font-black text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${rankColors.border}, ${rankColors.text}30)`,
                      border: `2px solid ${rankColors.border}`,
                      color: rankColors.text,
                    }}
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-exo2 font-black text-sm uppercase truncate"
                        style={{ color: rankColors.text }}
                      >
                        {user.username}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-rajdhani">
                      Level {user.level}
                    </div>
                  </div>
                  <RankBadge rank={user.rank} size="md" animated />
                </div>

                {/* XP Bar */}
                <XPBar xp={user.xp} />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatsCard
                  label="Total XP"
                  value={user.xp}
                  icon="⚡"
                  color="var(--accent-cyan)"
                />
                <StatsCard
                  label="Streak"
                  value={`${user.streak}d`}
                  icon="🔥"
                  color="#fb923c"
                />
                <StatsCard
                  label="Rank"
                  value={user.rank}
                  icon="🏆"
                  color={rankColors.text}
                />
                <StatsCard
                  label="Level"
                  value={user.level}
                  icon="📈"
                  color="var(--accent-purple)"
                />
              </div>

              {/* Quick tip */}
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(124,58,237,0.05)',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}
              >
                <p className="text-xs font-rajdhani text-muted-foreground">
                  💡{' '}
                  <span style={{ color: '#a78bfa' }}>Pro tip:</span> Complete challenges daily to
                  maintain your streak and earn bonus XP.
                </p>
              </div>
            </aside>

            {/* ===================== MAIN FEED ===================== */}
            <main className="flex-1 min-w-0">
              {/* Penalty Alert Banner */}
              {activePenaltyState && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-5 rounded-lg border border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💀</span>
                    <div>
                      <h3 className="font-exo2 font-black uppercase text-sm text-red-500 tracking-wider">
                        [SYSTEM WARNING]: PENALTY QUEST ACTIVE
                      </h3>
                      <p className="font-rajdhani text-sm text-neutral-300 mt-1">
                        Missed committed challenge. You are moved to the Penalty Zone!
                      </p>
                      <div className="font-rajdhani text-xs font-semibold text-neutral-400 mt-1.5 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1">
                        <span>Quest: <strong className="text-red-400">{activePenaltyState.challenge_text}</strong></span>
                        <span className="hidden sm:inline text-neutral-600">|</span>
                        <span>Potential Loss: <strong className="text-red-400">-{activePenaltyState.xp_loss} XP</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClearPenalty}
                      className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-exo2 font-black text-xs uppercase tracking-widest rounded shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                    >
                      Log Workout & Survive
                    </motion.button>
                  </div>
                </motion.div>
              )}
              {/* Page title */}
              <div className="mb-6">
                <h1
                  className="text-3xl font-exo2 font-black uppercase"
                  style={{
                    background: 'linear-gradient(135deg, #e2e8f0, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Daily Challenges
                </h1>
                <p className="text-sm text-muted-foreground font-rajdhani mt-1">
                  {filteredChallenges.length} challenges available · {completedIds.size} completed
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    id={`filter-${f.key}`}
                    onClick={() => setActiveFilter(f.key)}
                    className="px-4 py-1.5 rounded-full text-xs font-rajdhani font-semibold uppercase tracking-wider transition-all duration-200"
                    style={{
                      background:
                        activeFilter === f.key
                          ? 'rgba(124,58,237,0.3)'
                          : 'rgba(124,58,237,0.05)',
                      border: `1px solid ${
                        activeFilter === f.key
                          ? 'rgba(124,58,237,0.6)'
                          : 'rgba(124,58,237,0.15)'
                      }`,
                      color:
                        activeFilter === f.key
                          ? '#a78bfa'
                          : 'var(--text-muted)',
                      boxShadow:
                        activeFilter === f.key
                          ? '0 0 10px rgba(124,58,237,0.2)'
                          : 'none',
                    }}
                  >
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>

              {/* Challenge grid */}
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
                {filteredChallenges.map((challenge, i) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    completed={completedIds.has(challenge.id)}
                    pending={pendingIds.has(challenge.id)}
                    onAccept={setSelectedChallenge}
                    index={i}
                    committed={activeCommitState?.challenge_id === challenge.id}
                    onCommit={handleCommitQuest}
                    hasAnyCommitment={!!activeCommitState}
                  />
                ))}
              </div>

              {filteredChallenges.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-4xl mb-4">🕳️</p>
                  <p className="font-exo2 font-bold uppercase text-muted-foreground">
                    No challenges in this category yet
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* ===================== COMPLETION MODAL ===================== */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(4,4,12,0.85)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedChallenge(null)
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full max-w-lg rounded-xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${RANK_COLORS[selectedChallenge.difficulty].border}`,
                boxShadow: `0 0 40px ${RANK_COLORS[selectedChallenge.difficulty].glow}`,
              }}
            >
              {/* Modal header */}
              <div
                className="p-6 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-exo2 font-bold uppercase tracking-widest"
                    style={{ color: RANK_COLORS[selectedChallenge.difficulty].text }}
                  >
                    Rank {selectedChallenge.difficulty} Challenge
                  </span>
                  <button
                    onClick={() => setSelectedChallenge(null)}
                    className="text-muted-foreground hover:text-white transition-colors text-lg leading-none"
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                <h2
                  className="text-xl font-exo2 font-black uppercase"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {selectedChallenge.title}
                </h2>
                <p className="text-sm text-muted-foreground font-rajdhani mt-2">
                  {selectedChallenge.description}
                </p>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="proof-text"
                    className="text-xs font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground block mb-2"
                  >
                    Proof / Notes{' '}
                    <span className="normal-case text-muted-foreground/50">(optional)</span>
                  </label>
                  <textarea
                    id="proof-text"
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    placeholder="Describe how you completed this challenge..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg font-rajdhani text-sm resize-none focus:outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(124,58,237,0.05)',
                      border: '1px solid rgba(124,58,237,0.2)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="proof-image"
                    className="text-xs font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground block mb-2"
                  >
                    Upload Photo Proof <span className="normal-case text-muted-foreground/50">(optional)</span>
                  </label>
                  <input
                    id="proof-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setProofImageFile(e.target.files[0])
                      }
                    }}
                    className="w-full text-xs font-rajdhani text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-400 file:cursor-pointer hover:file:bg-purple-600/30"
                  />
                </div>

                {/* XP preview */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: 'rgba(6,182,212,0.05)',
                    border: '1px solid rgba(6,182,212,0.15)',
                  }}
                >
                  <span className="text-sm font-rajdhani text-muted-foreground">XP Reward</span>
                  <span
                    className="text-xl font-exo2 font-black"
                    style={{ color: 'var(--accent-cyan)', textShadow: '0 0 10px rgba(6,182,212,0.5)' }}
                  >
                    +{selectedChallenge.xp_reward.toLocaleString()} XP
                  </span>
                </div>

                {submitError && (
                  <p className="text-sm font-rajdhani text-red-400">{submitError}</p>
                )}

                <button
                  id="confirm-completion-btn"
                  onClick={handleSubmitCompletion}
                  disabled={submitting}
                  className="w-full py-3 rounded-lg font-exo2 font-black text-sm uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: selectedChallenge.is_boss_challenge
                      ? 'linear-gradient(135deg, #f59e0b, #fb923c)'
                      : 'linear-gradient(135deg, #7c3aed, #2563eb)',
                    color: '#ffffff',
                    boxShadow: selectedChallenge.is_boss_challenge
                      ? '0 0 20px rgba(245,158,11,0.4)'
                      : '0 0 20px rgba(124,58,237,0.4)',
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    `✓ Mark Complete · +${selectedChallenge.xp_reward} XP`
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== RANK UP OVERLAY ===================== */}
      <RankUpOverlay
        show={rankUpInfo.show}
        newRank={rankUpInfo.newRank}
        oldRank={rankUpInfo.oldRank}
        onDismiss={() => setRankUpInfo((prev) => ({ ...prev, show: false }))}
      />
    </>
  )
}
