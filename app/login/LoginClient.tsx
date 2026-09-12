'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
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
      options: { redirectTo: `${window.location.origin}/home` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  function handleLoginIntroComplete() {
    window.location.href = '/home'
  }

  return (
    <>
      {showAfterLoginIntro && (
        <VideoIntroOverlay src="/after_login.mp4" onComplete={handleLoginIntroComplete} shrinkOnMobile={true} />
      )}
      <div className="min-h-screen bg-[#020805] relative overflow-hidden">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-[#38F2A0]/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-0 right-0 h-96 opacity-10 bg-gradient-to-t from-[#19503B] via-[#020805] to-transparent" />
        </div>

        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-[#020805]/80 backdrop-blur-xl border-b border-[#153A2D]">
          <div className="h-20 max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#38F2A0] shadow-[0_0_12px_#38f2a0]" />
              <span className="text-lg font-semibold text-[#38F2A0] tracking-tight">arise by victarc</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-24 flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
          {/* Ambient Frost & Alpine Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[360px] bg-[#38F2A0]/10 rounded-full blur-[160px]" />
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-[#19503B]/20 rounded-full blur-[130px]" />
            <div className="absolute top-12 right-12 w-80 h-80 bg-[#38F2A0]/5 rounded-full blur-[140px]" />
          </div>

          {/* Main Container */}
          <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Panel - Winter Arc Info */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 lg:p-8 rounded-xl bg-[#07130F] shadow-xl relative overflow-hidden border border-[#153A2D]">
              <div className="relative z-10 flex flex-col gap-4">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#252B29] w-fit shadow-sm">
                  <span className="text-[14px]">❄️</span>
                  <span className="text-xs font-semibold text-[#38F2A0] uppercase tracking-wider">Winter Arc Protocol</span>
                  <span className="w-1 h-1 rounded-full bg-[#38F2A0]" />
                  <span className="text-xs text-[#A8B1AE]">Day 42 / 90</span>
                </div>

                {/* Manifesto */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs text-[#9bd2b6] uppercase tracking-widest font-medium">Discipline Over Comfort</span>
                  <h2 className="text-3xl lg:text-4xl font-bold text-[#F5F7F6] leading-tight">
                    Embrace the <span className="text-[#38F2A0]">stillness</span>.
                  </h2>
                  <p className="text-sm text-[#A8B1AE] mt-2">
                    When the temperature drops, true clarity ascends. 90 days of dawn reflections, uncompromised honesty, and mental sovereignty.
                  </p>
                </div>

                {/* Stats Card */}
                <div className="p-4 rounded-lg bg-[#0B1914] mt-4 flex items-center justify-between gap-4 shadow-md border border-[#153A2D]">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-3 border-[#3b4a40]" />
                      <div className="absolute inset-0 rounded-full border-3 border-[#38F2A0] border-t-transparent transform -rotate-90" style={{ borderWidth: '3px' }} />
                      <span className="absolute text-xs font-bold text-[#38F2A0]">67%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#A8B1AE] uppercase">Collective Elevation</span>
                      <span className="text-base font-semibold text-[#F5F7F6]">1,482 Cadets</span>
                      <span className="text-xs text-[#33e198]">Zero zero-days allowed</span>
                    </div>
                  </div>
                </div>

                {/* Affirmation */}
                <div className="relative z-10 pt-4 mt-4">
                  <div className="flex items-start gap-2">
                    <span className="text-[#38F2A0] text-lg shrink-0 mt-0.5">❄️</span>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-[#F5F7F6] italic">
                        “Discipline creates freedom. Every sunrise journal entry is a victory against nocturnal quiet chaos.”
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38F2A0]" />
                        <span className="text-xs text-[#A8B1AE]">Winter Arc Field Rule #04</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="lg:col-span-7 flex flex-col justify-center p-6 lg:p-8 rounded-xl bg-[#07130F] shadow-2xl relative border border-[#153A2D]">
              {/* Mode Tabs */}
              <div className="flex border-b border-[#153A2D]">
                {(['signin', 'signup'] as AuthMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                    className={`flex-1 py-4 text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
                      mode === m 
                        ? 'text-[#38F2A0] border-b-2 border-[#38F2A0]' 
                        : 'text-[#A8B1AE] border-b-2 border-transparent hover:text-[#F5F7F6]'
                    }`}
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
                    className="p-3 rounded-lg text-sm bg-[#38F2A0]/10 border border-[#38F2A0]/30 text-[#38F2A0]"
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
                    className="p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/30 text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-[#A8B1AE]">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_name"
                    className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-200 focus:outline-none bg-[#0B1914] border border-[#153A2D] text-[#F5F7F6] focus:border-[#38F2A0] focus:shadow-[0_0_10px_rgba(56,242,160,0.15)]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-[#A8B1AE]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-200 focus:outline-none bg-[#0B1914] border border-[#153A2D] text-[#F5F7F6] focus:border-[#38F2A0] focus:shadow-[0_0_10px_rgba(56,242,160,0.15)]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-[#A8B1AE]">
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
                  className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-200 focus:outline-none bg-[#0B1914] border border-[#153A2D] text-[#F5F7F6] focus:border-[#38F2A0] focus:shadow-[0_0_10px_rgba(56,242,160,0.15)]"
                />
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#38F2A0] text-[#002111] hover:bg-[#51ffad] hover:shadow-[0_0_20px_rgba(56,242,160,0.35)]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#002111]/30 border-t-[#002111] rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : mode === 'signin' ? (
                  'Begin Winter Arc →'
                ) : (
                  'Join the Protocol →'
                )}
              </button>
          </form>

              {/* Divider */}
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-[#153A2D]" />
                <span className="text-xs text-[#859588] uppercase">or</span>
                <div className="flex-1 h-px bg-[#153A2D]" />
              </div>

              {/* Google OAuth */}
              <button
                id="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 border border-[#153A2D] bg-[#0B1914] text-[#F5F7F6] hover:border-[#38F2A0] hover:bg-[#38F2A0]/10"
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
              <p className="text-center text-xs text-[#A8B1AE]">
                {mode === 'signin' ? (
                  <>
                    No account?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-[#38F2A0] hover:text-[#51ffad] transition-colors underline"
                    >
                      Sign up free
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('signin')}
                      className="text-[#38F2A0] hover:text-[#51ffad] transition-colors underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
