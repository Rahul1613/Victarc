'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'
import { getCachedProfile, setCachedProfile, clearAll } from '@/lib/storage'

interface AuthContextValue {
  user: { id: string; email: string } | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const ensureUserRow = useCallback(async (authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
    const email = authUser.email || ''
    const username =
      (authUser.user_metadata?.username as string | undefined) ||
      (authUser.user_metadata?.name as string | undefined) ||
      email.split('@')[0] ||
      'user'
    const name =
      (authUser.user_metadata?.name as string | undefined) ||
      username

    await supabase.from('users').upsert({
      id: authUser.id,
      email,
      username,
      name,
      bio: 'Progress, not perfection.',
    }, { onConflict: 'id' })
  }, [supabase])

  const fetchProfile = useCallback(async (userId: string) => {
    // Try cache first
    const cached = getCachedProfile()
    if (cached && cached.id === userId) setProfile(cached)

    const { data } = await supabase
      .from('users')
      .select('id, name, email, bio, avatar_url, created_at')
      .eq('id', userId)
      .single()

    if (data) {
      const p: UserProfile = {
        id: data.id,
        name: data.name || data.email?.split('@')[0] || '',
        email: data.email || '',
        bio: data.bio || 'Progress, not perfection.',
        avatar_url: data.avatar_url || null,
        created_at: data.created_at || new Date().toISOString(),
      }
      setProfile(p)
      setCachedProfile(p)
    }
  }, [supabase])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        await ensureUserRow(session.user)
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        await ensureUserRow(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile, ensureUserRow])

  const signUp = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, username: name } },
    })
    if (error) return { error: error.message }

    // Insert into users table (trigger may also do this, belt+suspenders)
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email,
        name,
        username: name,
        bio: 'Progress, not perfection.',
      }, { onConflict: 'id' })

      // Send welcome email
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (supabaseUrl && supabaseAnonKey) {
          await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              name,
            }),
          })
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't block signup if email fails
      }
    }
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      // Redirect to home after successful sign in
      window.location.href = '/home'
    }
    return { error: error?.message || null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    clearAll()
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { error: 'Not signed in' }
    const { error } = await supabase
      .from('users')
      .update({
        name: data.name,
        bio: data.bio,
        avatar_url: data.avatar_url,
      })
      .eq('id', user.id)
    if (!error && profile) {
      const updated = { ...profile, ...data }
      setProfile(updated)
      setCachedProfile(updated)
    }
    return { error: error?.message || null }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
