import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { User, Challenge } from '@/lib/types'
import AdminClient from './AdminClient'

interface DbCompletionRow {
  id: string
  user_id: string
  challenge_id: string
  proof_text: string | null
  completed_at: string
  xp_earned: number
  user: { username: string } | null
  challenge: { title: string } | null
}

export const metadata: Metadata = {
  title: 'Admin Panel — VICTARC',
  description: 'Manage quests, check hunters, and audit quest completions.',
}

export default async function AdminPage() {
  const supabase = await createClient()

  // Get authenticated auth user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  // Fetch current user's profile to verify is_admin
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  // If not admin, redirect to dashboard
  if (!user || !user.is_admin) {
    redirect('/dashboard')
  }

  // Fetch all users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('xp', { ascending: false })

  // Fetch all challenges (including inactive ones)
  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch completions (with user/challenge details)
  const { data: completions } = await supabase
    .from('completions')
    .select(`
      *,
      user:users(username),
      challenge:challenges(title)
    `)
    .order('completed_at', { ascending: false })
    .limit(50)

  // Cast completions to standard Completion type with nested properties
  const typedCompletions = ((completions || []) as unknown as DbCompletionRow[]).map((c) => ({
    id: c.id,
    user_id: c.user_id,
    challenge_id: c.challenge_id,
    proof_text: c.proof_text,
    completed_at: c.completed_at,
    xp_earned: c.xp_earned,
    challenge: c.challenge ? { title: c.challenge.title } : undefined,
    user: c.user ? { username: c.user.username } : undefined,
  }))

  return (
    <AdminClient
      initialUsers={(users || []) as User[]}
      initialChallenges={(challenges || []) as Challenge[]}
      initialCompletions={typedCompletions}
      currentUser={user as User}
    />
  )
}
