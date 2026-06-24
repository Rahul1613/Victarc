import type { Rank, XPProgress, RankUpInfo } from './types'
import { RANKS, XP_THRESHOLDS } from './constants'
import type { SupabaseClient } from '@supabase/supabase-js'

export function calculateRank(xp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[RANKS[i]]) {
      return RANKS[i]
    }
  }
  return 'E'
}

export function getNextRank(rank: Rank): Rank | null {
  const idx = RANKS.indexOf(rank)
  if (idx === RANKS.length - 1) return null
  return RANKS[idx + 1]
}

export function xpToNextRank(xp: number): XPProgress {
  const currentRank = calculateRank(xp)
  const nextRank = getNextRank(currentRank)
  const currentThreshold = XP_THRESHOLDS[currentRank]
  const nextThreshold = nextRank ? XP_THRESHOLDS[nextRank] : XP_THRESHOLDS[currentRank]

  if (!nextRank) {
    return {
      currentXP: xp,
      currentThreshold,
      nextThreshold,
      percentage: 100,
      currentRank,
      nextRank: null,
    }
  }

  const rangeSize = nextThreshold - currentThreshold
  const progressInRange = xp - currentThreshold
  const percentage = Math.min(100, Math.floor((progressInRange / rangeSize) * 100))

  return {
    currentXP: xp,
    currentThreshold,
    nextThreshold,
    percentage,
    currentRank,
    nextRank,
  }
}

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1
}

export async function awardXP(
  userId: string,
  xpAmount: number,
  supabase: SupabaseClient
): Promise<RankUpInfo> {
  // Get current user data
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('xp, rank, last_active, streak')
    .eq('id', userId)
    .single()

  if (fetchError || !currentUser) {
    throw new Error('Failed to fetch user data')
  }

  const oldXP = currentUser.xp
  const newXP = oldXP + xpAmount
  const oldRank = currentUser.rank as Rank
  const newRank = calculateRank(newXP)
  const newLevel = calculateLevel(newXP)

  // Update streak logic
  const today = new Date().toISOString().split('T')[0]
  const lastActive = currentUser.last_active
  let newStreak = currentUser.streak

  if (lastActive === today) {
    // Already completed something today — streak stays same
    newStreak = currentUser.streak
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (lastActive === yesterday) {
      // Continued streak
      newStreak = currentUser.streak + 1
    } else {
      // Streak broken
      newStreak = 1
    }
  }

  // Update user
  const { error: updateError } = await supabase
    .from('users')
    .update({
      xp: newXP,
      rank: newRank,
      level: newLevel,
      streak: newStreak,
      last_active: today,
    })
    .eq('id', userId)

  if (updateError) {
    throw new Error('Failed to update user XP')
  }

  return {
    rankUp: oldRank !== newRank,
    oldRank,
    newRank,
  }
}
