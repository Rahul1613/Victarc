import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { User, Challenge } from '@/lib/types'
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

  return (
    <DashboardClient
      user={finalUser as User}
      challenges={(challenges || []) as Challenge[]}
      completedIds={completedChallengeIds}
      pendingIds={pendingChallengeIds}
    />
  )
}
