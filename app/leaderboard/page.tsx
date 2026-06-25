import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { LeaderboardEntry, User } from '@/lib/types'
import LeaderboardClient from './LeaderboardClient'

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'Global VICTARC leaderboard. See who is leading the hunt.',
}

// Always fetch fresh leaderboard data on every request
export const revalidate = 0


export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Fetch top 50 from leaderboard view
  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(50)

  // Get current user (may be null if unauthenticated)
  const { data: { user: authUser } } = await supabase.auth.getUser()
  let currentUser: User | null = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    currentUser = data
  }

  return (
    <LeaderboardClient
      initialLeaderboard={(leaderboard || []) as LeaderboardEntry[]}
      currentUser={currentUser}
    />
  )
}
