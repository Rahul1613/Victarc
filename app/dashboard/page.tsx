import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { User, Challenge, CommittedQuest, PenaltyQuest } from '@/lib/types'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your VICTARC challenge feed. Accept and complete daily challenges to earn XP.',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  // Fetch user profile
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  let finalUser = user

  if (!user) {
    // Attempt to create the public profile row on the fly to recover from missing database trigger
    try {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || `hunter_${authUser.id.slice(0, 5)}`,
          email: authUser.email!,
          rank: 'E',
          xp: 0,
          level: 1,
          streak: 0,
          coins: 0,
          unlocked_items: [],
          unlocked_badges: [],
        })
        .select()
        .single()

      if (createError || !newUser) {
        // If it fails (e.g. database tables do not exist yet), render an error/setup page
        // rather than redirecting to /login and causing an infinite loop
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#08080f] text-white p-6">
            <h1 className="text-3xl font-exo2 font-black text-red-500 mb-4 tracking-widest">SYSTEM INITIALIZATION FAILED</h1>
            <p className="text-muted-foreground font-rajdhani text-center max-w-md mb-6 leading-relaxed">
              Your authentication account is active, but your Hunter Profile could not be created.
              <br /><br />
              <strong className="text-accent-purple">Did you run the database schema setup in your Supabase SQL editor?</strong>
              <br />
              Please make sure to run the SQL in <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">supabase/schema.sql</code> first.
              {createError && (
                <span className="block mt-4 text-xs bg-red-950/50 border border-red-900 text-red-400 p-3 rounded text-left font-mono break-all whitespace-pre-wrap">
                  <strong>Database Error:</strong>
                  <br />
                  Code: {createError.code}
                  <br />
                  Message: {createError.message}
                  {createError.details && (
                    <>
                      <br />
                      Details: {createError.details}
                    </>
                  )}
                </span>
              )}
            </p>
            <a
              href="/login"
              className="px-6 py-3 rounded font-exo2 font-black uppercase text-xs tracking-wider transition-all duration-200"
              style={{
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
              }}
            >
              Return to Login
            </a>
          </div>
        )
      }

      finalUser = newUser
    } catch {
      redirect('/login')
    }
  }

  // Redirect admin users straight to admin panel
  if (finalUser?.is_admin) {
    redirect('/admin')
  }

  // Fetch all active challenges
  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('difficulty', { ascending: true })

  // Fetch user's completions (to mark completed and pending challenges)
  const { data: completions } = await supabase
    .from('completions')
    .select('challenge_id, completed_at, status')
    .eq('user_id', authUser.id)

  const completedChallengeIds = (completions || [])
    .filter((c: { status: string }) => c.status === 'approved')
    .map((c: { challenge_id: string }) => c.challenge_id)

  const pendingChallengeIds = (completions || [])
    .filter((c: { status: string }) => c.status === 'pending')
    .map((c: { challenge_id: string }) => c.challenge_id)

  // Fetch committed quest (ignore error if table does not exist yet)
  const { data: committed, error: committedErr } = await supabase
    .from('committed_quests')
    .select('*, challenges(*)')
    .eq('user_id', authUser.id)
    .eq('status', 'active')

  // Fetch active penalty (ignore error if table does not exist yet)
  const { data: penalties, error: penaltiesErr } = await supabase
    .from('penalty_quests')
    .select('*')
    .eq('user_id', authUser.id)
    .eq('status', 'active')

  let activeCommit: CommittedQuest | null = committed && committed[0] ? (committed[0] as unknown as CommittedQuest) : null
  let activePenalty: PenaltyQuest | null = penalties && penalties[0] ? (penalties[0] as unknown as PenaltyQuest) : null

  // Run expiration logic only if tables exist
  if (!committedErr && !penaltiesErr) {
    const now = new Date()

    // 1. Check if the active commit has expired
    if (activeCommit && new Date(activeCommit.expires_at) < now) {
      await supabase
        .from('committed_quests')
        .update({ status: 'failed' })
        .eq('id', activeCommit.id)

      const xpReward = (activeCommit as { challenges?: { xp_reward?: number } }).challenges?.xp_reward || 100
      let xpLoss = 100
      let penaltyText = 'Perform 80 pushups + 1km run in 3 hours'
      let durationHours = 3

      if (xpReward < 150) {
        xpLoss = 30
        penaltyText = 'Perform 40 pushups in 2 hours'
        durationHours = 2
      } else if (xpReward > 300) {
        xpLoss = 200
        penaltyText = 'Perform 150 pushups + 2km run in 4 hours'
        durationHours = 4
      }

      const deadline = new Date()
      deadline.setHours(deadline.getHours() + durationHours)

      const { data: newPenalty } = await supabase
        .from('penalty_quests')
        .insert({
          user_id: authUser.id,
          challenge_text: penaltyText,
          xp_loss: xpLoss,
          deadline: deadline.toISOString(),
          status: 'active',
        })
        .select()
        .single()

      activeCommit = null
      if (newPenalty) {
        activePenalty = newPenalty as unknown as PenaltyQuest
      }
    }

    // 2. Check if active penalty has expired/failed
    if (activePenalty && new Date(activePenalty.deadline) < now) {
      await supabase
        .from('penalty_quests')
        .update({ status: 'failed' })
        .eq('id', activePenalty.id)

      const xpLoss = activePenalty.xp_loss
      const newXp = Math.max(0, finalUser.xp - xpLoss)
      const newLevel = Math.floor(newXp / 100) + 1

      await supabase
        .from('users')
        .update({
          xp: newXp,
          level: newLevel,
          streak: 0,
        })
        .eq('id', authUser.id)

      finalUser.xp = newXp
      finalUser.level = newLevel
      finalUser.streak = 0
      activePenalty = null
    }
  }

  return (
    <DashboardClient
      user={finalUser as User}
      challenges={(challenges || []) as Challenge[]}
      completedIds={completedChallengeIds}
      pendingIds={pendingChallengeIds}
      activeCommit={activeCommit}
      activePenalty={activePenalty}
    />
  )
}
