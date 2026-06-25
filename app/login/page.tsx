'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import VideoIntroOverlay from '@/components/VideoIntroOverlay'

type AuthMode = 'signin' | 'signup'

export default function LoginPage() {
  const supabase = createClient()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAfterLoginIntro, setShowAfterLoginIntro] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username || email.split('@')[0] },
          },
        })
        if (signUpError) throw signUpError

        // Update username in users table if provided
        if (username) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase
              .from('users')
              .update({ username })
              .eq('id', user.id)
          }
        }

        setSuccess('Account created successfully! You can now sign in.')
        setMode('signin')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        
        // Stop loading and show the epic after login video splash screen
        setLoading(false)
        setShowAfterLoginIntro(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  function handleLoginIntroComplete() {
    window.location.href = '/dashboard'
  }

  return (
    <>
      {showAfterLoginIntro && (
        <VideoIntroOverlay src="/after_login.mp4" onComplete={handleLoginIntroComplete} />
      )}
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}
      >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Grid */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Back link */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs font-rajdhani font-semibold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
      >
        ← Back
      </Link>

      {/* Logo */}
      <Link href="/" className="mb-8 relative z-10">
        <div
          className="text-3xl font-exo2 font-black tracking-widest uppercase"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 16px rgba(124,58,237,0.7))',
          }}
        >
          VICTARC
        </div>
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(124,58,237,0.1)',
        }}
      >
        {/* Mode tabs */}
        <div
          className="flex border-b"
          style={{ borderColor: 'rgba(124,58,237,0.15)' }}
        >
          {(['signin', 'signup'] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className="flex-1 py-4 text-sm font-exo2 font-bold uppercase tracking-widest transition-all duration-200"
              style={{
                color: mode === m ? '#a78bfa' : 'var(--text-muted)',
                borderBottom: mode === m ? '2px solid #7c3aed' : '2px solid transparent',
                background: 'none',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* Success message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg text-sm font-rajdhani"
                style={{
                  background: 'rgba(134,239,172,0.1)',
                  border: '1px solid rgba(134,239,172,0.3)',
                  color: '#86efac',
                }}
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg text-sm font-rajdhani"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-xs font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="shadow_monarch"
                  className="w-full px-4 py-3 rounded-lg font-rajdhani text-sm transition-all duration-200 focus:outline-none"
                  style={{
                    background: 'rgba(124,58,237,0.05)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(124,58,237,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hunter@victarc.com"
                required
                className="w-full px-4 py-3 rounded-lg font-rajdhani text-sm transition-all duration-200 focus:outline-none"
                style={{
                  background: 'rgba(124,58,237,0.05)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(124,58,237,0.15)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-rajdhani font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg font-rajdhani text-sm transition-all duration-200 focus:outline-none"
                style={{
                  background: 'rgba(124,58,237,0.05)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(124,58,237,0.15)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-exo2 font-black text-sm uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #2563eb)',
                color: '#ffffff',
                boxShadow: loading ? 'none' : '0 0 20px rgba(124,58,237,0.3)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  Processing...
                </span>
              ) : mode === 'signin' ? (
                'Sign In →'
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs text-muted-foreground font-rajdhani uppercase">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Google OAuth */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 rounded-lg font-rajdhani font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Bottom hint */}
          <p className="text-center text-xs text-muted-foreground font-rajdhani">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-accent-purple hover:text-purple-400 transition-colors underline"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already a hunter?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-accent-purple hover:text-purple-400 transition-colors underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
    </>
  )
}
