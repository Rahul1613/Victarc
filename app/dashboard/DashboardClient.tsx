'use client'

import { useState, useMemo, useEffect } from 'react'
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
  completions: { challenge_id: string; completed_at: string; status: string }[]
  activeCommit: CommittedQuest | null
  activePenalty: PenaltyQuest | null
}

export default function DashboardClient({
  user: initialUser,
  challenges,
  completions = [],
  activeCommit: initialActiveCommit,
  activePenalty: initialActivePenalty,
}: DashboardClientProps) {
  const [currentUser, setCurrentUser] = useState<User>(initialUser)
  const user = currentUser

  // Timezone-aware date checker
  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Filter completions to today's local day
  const todayCompletions = useMemo(() => {
    return completions.filter(c => isToday(c.completed_at))
  }, [completions])

  const completedIds = useMemo(() => {
    const approved = todayCompletions
      .filter(c => c.status === 'approved')
      .map(c => c.challenge_id)
    return new Set(approved)
  }, [todayCompletions])

  const [pendingIds, setPendingIds] = useState<Set<string>>(() => {
    const pending = completions
      .filter(c => c.status === 'pending' && isToday(c.completed_at))
      .map(c => c.challenge_id)
    return new Set(pending)
  })

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
  const [timeLeft, setTimeLeft] = useState('')

  // Live countdown timer until local midnight
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      
      const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)))
      const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)))
      const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000))
      
      const pad = (num: number) => String(num).padStart(2, '0')
      setTimeLeft(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  // Select daily challenges deterministically based on date (rotates at midnight)
  const dailyChallenges = useMemo(() => {
    const today = new Date()
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    
    let seed = 0
    for (let i = 0; i < dateString.length; i++) {
      seed += dateString.charCodeAt(i)
    }
    
    const seededRandom = () => {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    }
    
    const easy = challenges.filter(c => c.difficulty === 'E' && !c.is_boss_challenge)
    const medium = challenges.filter(c => (c.difficulty === 'D' || c.difficulty === 'C') && !c.is_boss_challenge)
    const hard = challenges.filter(c => (c.difficulty === 'B' || c.difficulty === 'A') && !c.is_boss_challenge)
    const boss = challenges.filter(c => c.is_boss_challenge || c.difficulty === 'S')
    
    const selected: Challenge[] = []
    
    if (easy.length > 0) {
      const idx = Math.floor(seededRandom() * easy.length)
      selected.push(easy[idx])
    }
    if (medium.length > 0) {
      const idx = Math.floor(seededRandom() * medium.length)
      selected.push(medium[idx])
    }
    if (hard.length > 0) {
      const idx = Math.floor(seededRandom() * hard.length)
      selected.push(hard[idx])
    }
    
    selected.push(...boss)
    
    if (activeCommitState) {
      const committedChallenge = challenges.find(c => c.id === activeCommitState.challenge_id)
      if (committedChallenge && !selected.some(c => c.id === activeCommitState.challenge_id)) {
        selected.push(committedChallenge)
      }
    }
    
    return Array.from(new Set(selected))
  }, [challenges, activeCommitState])
  
  // Shadow Vault & Milestone states
  const [activeDashboardTab, setActiveDashboardTab] = useState<'challenges' | 'vault'>('challenges')
  const [showCrowningCeremony, setShowCrowningCeremony] = useState(false)
  const [submittingVault, setSubmittingVault] = useState(false)

  const supabase = createClient()

  const FILTERS: { key: FilterTab; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '⚡' },
    { key: 'fitness', label: 'Fitness', icon: '💪' },
    { key: 'mindset', label: 'Mindset', icon: '🧠' },
    { key: 'discipline', label: 'Discipline', icon: '🔥' },
    { key: 'nutrition', label: 'Nutrition', icon: '💧' },
    { key: 'boss', label: 'Boss', icon: '⚔️' },
  ]

  const filteredChallenges = dailyChallenges.filter((c) => {
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

      // Award 150 coins
      const newCoins = (user.coins || 0) + 150
      const { error: userError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', user.id)

      if (userError) throw userError

      setCurrentUser((prev) => ({
        ...prev,
        coins: newCoins,
      }))
      setActivePenaltyState(null)
    } catch (err) {
      console.error('Error clearing penalty:', err)
      alert('Failed to log penalty completion. Please try again.')
    }
  }

  async function handlePurchaseItem(itemId: string, price: number) {
    if ((user.coins || 0) < price) {
      alert('Insufficient Victarc Coins!')
      return
    }
    setSubmittingVault(true)
    try {
      const newCoins = (user.coins || 0) - price
      const newUnlockedItems = [...(user.unlocked_items || []), itemId]

      const { error } = await supabase
        .from('users')
        .update({
          coins: newCoins,
          unlocked_items: newUnlockedItems,
        })
        .eq('id', user.id)

      if (error) throw error

      setCurrentUser((prev) => ({
        ...prev,
        coins: newCoins,
        unlocked_items: newUnlockedItems,
      }))
    } catch (err) {
      console.error('Purchase error:', err)
      alert('Error making purchase: ' + (err instanceof Error ? err.message : err))
    } finally {
      setSubmittingVault(false)
    }
  }

  async function handleClaimCrowning() {
    setSubmittingVault(true)
    try {
      const newBadges = [...(user.unlocked_badges || []), 'monarch_month']

      const { error } = await supabase
        .from('users')
        .update({
          unlocked_badges: newBadges,
        })
        .eq('id', user.id)

      if (error) throw error

      setCurrentUser((prev) => ({
        ...prev,
        unlocked_badges: newBadges,
      }))
      setShowCrowningCeremony(true)
    } catch (err) {
      console.error('Error claiming badge:', err)
      alert('Error claiming badge: ' + (err instanceof Error ? err.message : err))
    } finally {
      setSubmittingVault(false)
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
              {/* Custom CSS styles for unlocked cosmetics */}
              <style dangerouslySetInnerHTML={{ __html: `
                .border-exclusive {
                  border: 2px solid #fbbf24 !important;
                  box-shadow: 0 0 15px rgba(245, 158, 11, 0.5), inset 0 0 10px rgba(245, 158, 11, 0.2) !important;
                }
                @keyframes spin-frame {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                .profile-frame-animation {
                  position: absolute;
                  inset: -4px;
                  border-radius: 50%;
                  border: 3px solid #7c3aed;
                  border-top-color: transparent;
                  border-bottom-color: transparent;
                  animation: spin-frame 2s linear infinite;
                  box-shadow: 0 0 10px #7c3aed;
                  z-index: 10;
                }
                .aura-dark-shadow {
                  box-shadow: 0 0 25px 5px #000, 0 0 50px 10px rgba(124, 58, 237, 0.5) !important;
                  border-color: #4a1d96 !important;
                  animation: dark-shimmer-pulse 3s infinite ease-in-out;
                }
                @keyframes dark-shimmer-pulse {
                  0%, 100% { transform: scale(1); box-shadow: 0 0 25px 5px #000, 0 0 45px 10px rgba(124, 58, 237, 0.35); }
                  50% { transform: scale(1.015); box-shadow: 0 0 35px 8px #000, 0 0 65px 15px rgba(124, 58, 237, 0.65); }
                }
                @keyframes float-particle {
                  0% { transform: translateY(0) scale(1); opacity: 0; }
                  10% { opacity: 0.8; }
                  90% { opacity: 0.8; }
                  100% { transform: translateY(-200px) translateX(var(--drift, 10px)) scale(0); opacity: 0; }
                }
                .shadow-dot {
                  position: absolute;
                  width: 4px;
                  height: 4px;
                  border-radius: 50%;
                  background: #7c3aed;
                  box-shadow: 0 0 8px #7c3aed;
                  bottom: -10px;
                  animation: float-particle 4s infinite linear;
                }
              `}} />

              {/* User card */}
              <div
                className={`p-5 rounded-xl relative overflow-hidden transition-all duration-300 ${
                  user.unlocked_items?.includes('exclusive_border') ? 'border-exclusive' : ''
                } ${
                  user.unlocked_items?.includes('dark_aura') ? 'aura-dark-shadow' : ''
                }`}
                style={{
                  background: 'var(--bg-card)',
                  ...(!user.unlocked_items?.includes('exclusive_border') && {
                    border: `1px solid ${rankColors.border}`,
                  }),
                  ...(!user.unlocked_items?.includes('dark_aura') && {
                    boxShadow: `0 0 20px ${rankColors.glow}`,
                  }),
                }}
              >
                {/* Floating Particles overlay */}
                {user.unlocked_items?.includes('shadow_particles') && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-xl">
                    {[...Array(12)].map((_, i) => {
                      const left = (i * 8.3) + Math.random() * 3;
                      const delay = Math.random() * 4;
                      const drift = Math.random() * 40 - 20;
                      return (
                        <div
                          key={i}
                          className="shadow-dot"
                          style={{
                            left: `${left}%`,
                            animationDelay: `${delay}s`,
                            '--drift': `${drift}px`
                          } as React.CSSProperties}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    {user.unlocked_items?.includes('profile_frame') && (
                      <div className="profile-frame-animation" />
                    )}
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center font-exo2 font-black text-lg relative z-20"
                      style={{
                        background: `linear-gradient(135deg, ${rankColors.border}, ${rankColors.text}30)`,
                        border: `2px solid ${rankColors.border}`,
                        color: rankColors.text,
                      }}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-exo2 font-black text-sm uppercase truncate flex items-center gap-1"
                        style={{ color: rankColors.text }}
                      >
                        {user.unlocked_items?.includes('hunter_title') && (
                          <span className="text-muted-foreground font-semibold text-[10px] normal-case mr-1">[HUNTER]</span>
                        )}
                        {user.username}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-rajdhani">
                      Level {user.level}
                    </div>
                    {user.unlocked_items?.includes('shadow_monarch_title') && (
                      <div
                        className="text-[9px] font-exo2 font-black tracking-widest uppercase mt-0.5"
                        style={{
                          color: '#a78bfa',
                          textShadow: '0 0 8px rgba(139,92,246,0.6)',
                        }}
                      >
                        👑 [SHADOW MONARCH] 👑
                      </div>
                    )}
                  </div>
                  <RankBadge rank={user.rank} size="md" animated />
                </div>

                {/* Milestone Badge Tray */}
                <div className="flex flex-wrap gap-1.5 my-3 relative z-10">
                  {user.unlocked_badges?.includes('monarch_month') && (
                    <span
                      className="text-[9px] font-exo2 font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider"
                      style={{
                        background: 'rgba(245,158,11,0.15)',
                        borderColor: '#fbbf24',
                        color: '#fbbf24',
                      }}
                      title="Monarch of the Month Badge"
                    >
                      👑 Monarch
                    </span>
                  )}
                  {user.rank !== 'D' && user.rank !== 'E' && (
                    <span
                      className="text-[9px] font-exo2 font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider"
                      style={{
                        background: 'rgba(6,182,212,0.15)',
                        borderColor: '#06b6d4',
                        color: '#06b6d4',
                      }}
                      title="Gate Conqueror Badge"
                    >
                      🛡️ Conqueror
                    </span>
                  )}
                  {completedIds.size > 0 && (
                    <span
                      className="text-[9px] font-exo2 font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider"
                      style={{
                        background: 'rgba(59,130,246,0.15)',
                        borderColor: '#3b82f6',
                        color: '#3b82f6',
                      }}
                      title="Raid Champion Badge"
                    >
                      ❄️ Champion
                    </span>
                  )}
                  {user.unlocked_items?.includes('deaths_knight_badge') && (
                    <span
                      className="text-[9px] font-exo2 font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider"
                      style={{
                        background: 'rgba(139,92,246,0.15)',
                        borderColor: '#a78bfa',
                        color: '#a78bfa',
                      }}
                      title="Death's Knight Badge"
                    >
                      🛡️☠️ Death&apos;s Knight
                    </span>
                  )}
                </div>

                {/* XP Bar */}
                <div className="relative z-10">
                  <XPBar xp={user.xp} />
                </div>
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
                <div className="col-span-2">
                  <StatsCard
                    label="Victarc Coins"
                    value={`${(user.coins || 0).toLocaleString()} 🪙`}
                    icon="💰"
                    color="#fbbf24"
                  />
                </div>
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
              
              {/* Tab Navigation */}
              <div className="flex gap-6 border-b border-white/10 pb-3 mb-6">
                <button
                  onClick={() => setActiveDashboardTab('challenges')}
                  className={`font-exo2 font-black uppercase text-xs tracking-wider pb-1 border-b-2 transition-all duration-200 ${
                    activeDashboardTab === 'challenges'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-muted-foreground hover:text-white'
                  }`}
                >
                  ⚡ Daily Quests
                </button>
                <button
                  onClick={() => setActiveDashboardTab('vault')}
                  className={`font-exo2 font-black uppercase text-xs tracking-wider pb-1 border-b-2 transition-all duration-200 ${
                    activeDashboardTab === 'vault'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-muted-foreground hover:text-white'
                  }`}
                >
                  🪙 The Shadow Vault
                </button>
              </div>

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

              {/* Challenges Tab content */}
              {activeDashboardTab === 'challenges' && (
                <>
                  {/* Page title */}
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
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

                    {/* Countdown Timer */}
                    <div
                      className="px-4 py-2 rounded-lg border border-purple-500/30 bg-purple-950/20 shadow-[0_0_15px_rgba(167,139,250,0.1)] flex items-center gap-2 self-start sm:self-auto"
                    >
                      <span className="text-base animate-pulse">⏰</span>
                      <div className="font-rajdhani text-xs">
                        <span className="text-muted-foreground block uppercase font-bold tracking-wider text-[10px]">Next Reset In</span>
                        <span className="font-mono font-bold text-sm text-purple-400 tracking-wider">
                          {timeLeft}
                        </span>
                      </div>
                    </div>
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
                </>
              )}

              {/* The Shadow Vault Tab content */}
              {activeDashboardTab === 'vault' && (
                <div className="space-y-6 text-left">
                  {/* Headline */}
                  <div>
                    <h1
                      className="text-3xl font-exo2 font-black uppercase"
                      style={{
                        background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      🪙 The Shadow Vault
                    </h1>
                    <p className="text-sm text-muted-foreground font-rajdhani mt-1">
                      Spend your hard-earned Victarc Coins to unlock exclusive profile cosmetics.
                    </p>
                  </div>

                  {/* Balance Display */}
                  <div
                    className="p-5 rounded-lg flex justify-between items-center"
                    style={{
                      background: 'rgba(124,58,237,0.05)',
                      border: '1px solid rgba(124,58,237,0.15)',
                    }}
                  >
                    <div>
                      <span className="text-xs uppercase text-muted-foreground font-rajdhani">Your Balance</span>
                      <div className="text-2xl font-exo2 font-black text-[#fbbf24]">
                        {(user.coins || 0).toLocaleString()} 🪙
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase text-muted-foreground font-rajdhani">Items Unlocked</span>
                      <div className="text-2xl font-exo2 font-black text-white">
                        {user.unlocked_items?.length || 0} / 7
                      </div>
                    </div>
                  </div>

                  {/* Shop Grid */}
                  <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      { id: 'shadow_monarch_title', title: '"Shadow Monarch" Title', price: 5000, rarity: 'Legendary', desc: 'Displays the ultimate legendary title below your name in glowing text.' },
                      { id: 'dark_aura', title: 'Dark Aura Effect', price: 4000, rarity: 'Legendary', desc: 'Radiates a massive dark purple shadow smoke visual behind your profile card.' },
                      { id: 'exclusive_border', title: 'Exclusive Gold Border', price: 3000, rarity: 'Legendary', desc: 'Encases your profile card in a glowing gold-runed runic frame.' },
                      { id: 'profile_frame', title: 'Animated Avatar Frame', price: 2000, rarity: 'Rare', desc: 'Enables a spinning, glowing purple ring outline around your avatar crest.' },
                      { id: 'shadow_particles', title: 'Shadow Particles', price: 1500, rarity: 'Rare', desc: 'Releases floating purple energy sparks that rise from the bottom of your profile card.' },
                      { id: 'deaths_knight_badge', title: '"Death\'s Knight" Badge', price: 1000, rarity: 'Rare', desc: 'Unlocks a scary skull shield badge (🛡️☠️) displayed directly inside your profile badge tray.' },
                      { id: 'hunter_title', title: '"Hunter" Title Badge', price: 250, rarity: 'Common', desc: 'Adds a simple, clean [HUNTER] prefix title displayed next to your profile username.' }
                    ].map((item) => {
                      const isUnlocked = user.unlocked_items?.includes(item.id);
                      const canAfford = (user.coins || 0) >= item.price;
                      return (
                        <div
                          key={item.id}
                          className="p-5 rounded-lg border flex flex-col justify-between"
                          style={{
                            background: 'var(--bg-card)',
                            borderColor: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          <div>
                            <span
                              className="text-[9px] font-exo2 font-bold px-1.5 py-0.5 rounded border inline-block mb-3 uppercase tracking-wider"
                              style={{
                                background: item.rarity === 'Legendary' ? 'rgba(245,158,11,0.15)' : item.rarity === 'Rare' ? 'rgba(139,92,246,0.15)' : 'rgba(96,165,250,0.15)',
                                borderColor: item.rarity === 'Legendary' ? '#fbbf24' : item.rarity === 'Rare' ? '#a78bfa' : '#60a5fa',
                                color: item.rarity === 'Legendary' ? '#fbbf24' : item.rarity === 'Rare' ? '#a78bfa' : '#60a5fa',
                              }}
                            >
                              {item.rarity}
                            </span>
                            <h3 className="text-base font-exo2 font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-xs text-muted-foreground font-rajdhani leading-relaxed mb-4">{item.desc}</p>
                          </div>
                          <button
                            disabled={isUnlocked || !canAfford || submittingVault}
                            onClick={() => handlePurchaseItem(item.id, item.price)}
                            className="w-full py-2.5 rounded font-exo2 font-black text-xs uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                            style={{
                              background: isUnlocked
                                ? 'rgba(255,255,255,0.05)'
                                : canAfford
                                ? 'linear-gradient(135deg, #7c3aed, #2563eb)'
                                : 'rgba(255,255,255,0.05)',
                              border: isUnlocked || !canAfford ? '1px solid rgba(255,255,255,0.15)' : 'none',
                              color: isUnlocked ? 'var(--text-muted)' : !canAfford ? 'var(--text-muted)' : '#ffffff',
                              boxShadow: isUnlocked || !canAfford ? 'none' : '0 0 15px rgba(124,58,237,0.3)',
                            }}
                          >
                            {isUnlocked ? 'Unlocked' : `Unlock: ${item.price.toLocaleString()} 🪙`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Prestige Milestones */}
                  <div className="pt-6 border-t border-white/10">
                    <h2
                      className="text-2xl font-exo2 font-black uppercase mb-2"
                      style={{
                        background: 'linear-gradient(135deg, #a78bfa, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      🏆 Prestige Milestones Badges
                    </h2>
                    <p className="text-sm text-muted-foreground font-rajdhani mb-6">
                      Prestige badges represent your highest achievements in the Victarc System. Complete milestones to claim them.
                    </p>

                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                      {/* Milestone 1: Monarch of the Month */}
                      <div
                        className="p-5 rounded-lg border flex flex-col justify-between"
                        style={{
                          background: 'var(--bg-card)',
                          borderColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div>
                          <span className="text-[9px] font-exo2 font-bold px-1.5 py-0.5 rounded border inline-block mb-3 uppercase tracking-wider"
                            style={{
                              background: 'rgba(245,158,11,0.15)',
                              borderColor: '#fbbf24',
                              color: '#fbbf24',
                            }}
                          >
                            Milestone Badge
                          </span>
                          <h3 className="text-base font-exo2 font-bold text-white mb-1">Monarch of the Month</h3>
                          <p className="text-xs text-muted-foreground font-rajdhani leading-relaxed mb-4">
                            Claim the crowning throne of the monthly leaderboard. Unlocks the prestigious 👑 Monarch badge.
                          </p>
                        </div>
                        <button
                          disabled={user.unlocked_badges?.includes('monarch_month') || submittingVault}
                          onClick={handleClaimCrowning}
                          className="w-full py-2.5 rounded font-exo2 font-black text-xs uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                          style={{
                            background: user.unlocked_badges?.includes('monarch_month')
                              ? 'rgba(255,255,255,0.05)'
                              : 'linear-gradient(135deg, #7c3aed, #2563eb)',
                            border: user.unlocked_badges?.includes('monarch_month') ? '1px solid rgba(255,255,255,0.15)' : 'none',
                            color: user.unlocked_badges?.includes('monarch_month') ? 'var(--text-muted)' : '#ffffff',
                          }}
                        >
                          {user.unlocked_badges?.includes('monarch_month') ? 'Claimed' : 'Simulate Crowning Ceremony'}
                        </button>
                      </div>

                      {/* Milestone 2: Gate Conqueror */}
                      <div
                        className="p-5 rounded-lg border flex flex-col justify-between"
                        style={{
                          background: 'var(--bg-card)',
                          borderColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div>
                          <span className="text-[9px] font-exo2 font-bold px-1.5 py-0.5 rounded border inline-block mb-3 uppercase tracking-wider"
                            style={{
                              background: 'rgba(96,165,250,0.15)',
                              borderColor: '#60a5fa',
                              color: '#60a5fa',
                            }}
                          >
                            Milestone Badge
                          </span>
                          <h3 className="text-base font-exo2 font-bold text-white mb-1">Gate Conqueror</h3>
                          <p className="text-xs text-muted-foreground font-rajdhani leading-relaxed mb-4">
                            Defeat a Rank Trial Gate and upgrade your Hunter Rank. Unlocks the 🛡️ Conqueror badge.
                          </p>
                        </div>
                        <div
                          className="w-full py-2.5 text-center rounded border font-rajdhani font-bold text-xs uppercase tracking-wider"
                          style={{
                            background: user.rank !== 'D' && user.rank !== 'E' ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.2)',
                            borderColor: user.rank !== 'D' && user.rank !== 'E' ? '#10b981' : 'rgba(255,255,255,0.15)',
                            color: user.rank !== 'D' && user.rank !== 'E' ? '#10b981' : 'var(--text-muted)',
                          }}
                        >
                          {user.rank !== 'D' && user.rank !== 'E' ? '✓ Unlocked' : 'Locked (Requires Rank C+)'}
                        </div>
                      </div>

                      {/* Milestone 3: Raid Champion */}
                      <div
                        className="p-5 rounded-lg border flex flex-col justify-between"
                        style={{
                          background: 'var(--bg-card)',
                          borderColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div>
                          <span className="text-[9px] font-exo2 font-bold px-1.5 py-0.5 rounded border inline-block mb-3 uppercase tracking-wider"
                            style={{
                              background: 'rgba(59,130,246,0.15)',
                              borderColor: '#3b82f6',
                              color: '#3b82f6',
                            }}
                          >
                            Milestone Badge
                          </span>
                          <h3 className="text-base font-exo2 font-bold text-white mb-1">Raid Champion</h3>
                          <p className="text-xs text-muted-foreground font-rajdhani leading-relaxed mb-4">
                            Clear at least one dungeon raid to completion. Unlocks the ❄️ Champion badge.
                          </p>
                        </div>
                        <div
                          className="w-full py-2.5 text-center rounded border font-rajdhani font-bold text-xs uppercase tracking-wider"
                          style={{
                            background: completedIds.size > 0 ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.2)',
                            borderColor: completedIds.size > 0 ? '#10b981' : 'rgba(255,255,255,0.15)',
                            color: completedIds.size > 0 ? '#10b981' : 'var(--text-muted)',
                          }}
                        >
                          {completedIds.size > 0 ? '✓ Unlocked' : 'Locked (Requires 1 Completed Challenge)'}
                        </div>
                      </div>
                    </div>
                  </div>
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

      {/* ===================== CROWNING CEREMONY OVERLAY ===================== */}
      <AnimatePresence>
        {showCrowningCeremony && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-[#04040c]/95"
          >
            {/* Ambient gold/purple background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_60%)] pointer-events-none" />

            {/* Rising Crown Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {[...Array(25)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: '105vh', x: `${Math.random() * 100}vw`, opacity: 0 }}
                  animate={{
                    y: '-10vh',
                    opacity: [0, 0.8, 0.8, 0],
                  }}
                  transition={{
                    duration: Math.random() * 5 + 4,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: 'linear',
                  }}
                  className="absolute w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#7c3aed]"
                />
              ))}
            </div>

            {/* Monarch Card */}
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative max-w-md w-full p-8 rounded-2xl border text-center z-10 shadow-[0_0_50px_rgba(124,58,237,0.4)]"
              style={{
                background: 'rgba(17,17,27,0.95)',
                borderColor: '#fbbf24',
              }}
            >
              <div className="text-6xl mb-6 animate-bounce">👑</div>
              <h2 className="text-3xl font-exo2 font-black uppercase text-amber-400 tracking-widest mb-2 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                Crowned Monarch
              </h2>
              <p className="text-sm font-rajdhani text-muted-foreground uppercase tracking-widest mb-6">
                Monthly leaderboard supremacy unlocked
              </p>
              
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center font-exo2 font-black text-3xl text-white mb-6 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                {user.username.slice(0, 2).toUpperCase()}
              </div>

              <h3 className="text-xl font-exo2 font-black uppercase text-white mb-1">
                {user.username}
              </h3>
              <p className="text-xs font-rajdhani text-purple-400 uppercase tracking-widest mb-6">
                Active Streak: {user.streak} Days
              </p>

              <button
                onClick={() => setShowCrowningCeremony(false)}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-exo2 font-black text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all duration-200"
              >
                Claim Prestige Badge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
