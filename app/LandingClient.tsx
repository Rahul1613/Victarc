'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

type Screen = 'hero' | 'signin' | 'signup'

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-15%',
          width: '55vw',
          height: '55vw',
          maxWidth: 340,
          maxHeight: 340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,242,160,0.09) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float-orb1 12s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '-10%',
          width: '45vw',
          height: '45vw',
          maxWidth: 280,
          maxHeight: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,242,160,0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'float-orb2 16s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes float-orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(20px,-20px) scale(1.05); }
          66% { transform: translate(-10px,15px) scale(0.95); }
        }
        @keyframes float-orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-15px,-25px) scale(1.08); }
        }
      `}</style>
    </div>
  )
}

// ─── Hero Screen ─────────────────────────────────────────────────
function HeroScreen({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return (
    <div
      className="animate-fade-up"
      style={{ 
        padding: '0 24px 120px', 
        minHeight: '100dvh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/rise-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0
        }}
      />
      
      {/* Dark overlay for text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(2,11,8,0.7) 0%, rgba(2,11,8,0.5) 50%, rgba(2,11,8,0.8) 100%)',
          zIndex: 1
        }}
      />

      {/* Content */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 60, 
        zIndex: 1,
        marginTop: 'auto'
      }}>
        {/* RISE Typography */}
        <h1 style={{ 
          fontSize: 'clamp(48px, 12vw, 72px)', 
          fontWeight: 800, 
          letterSpacing: '0.15em',
          color: '#32E89A',
          marginBottom: 8,
          fontFamily: 'Georgia, serif',
          textShadow: '0 0 40px rgba(56,242,160,0.3)'
        }}>
          RISE
        </h1>
        
        {/* Tagline */}
        <p style={{ 
          fontSize: 'clamp(12px, 3vw, 16px)', 
          fontWeight: 600, 
          letterSpacing: '0.3em',
          color: '#AAB5B1',
          marginBottom: 40,
          lineHeight: 1.8
        }}>
          ABOVE EVERYONE...<br />
          BEFORE EVERYONE...
        </p>

        {/* CTA Button */}
        <button 
          id="hero-start-btn"
          onClick={onSignUp}
          style={{
            width: '100%',
            maxWidth: 280,
            padding: '18px 32px',
            borderRadius: 30,
            background: '#32E89A',
            color: '#020B08',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(56,242,160,0.4)',
            transition: 'all 0.3s ease',
            marginBottom: 20
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 0 40px rgba(56,242,160,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 0 30px rgba(56,242,160,0.4)'
          }}
        >
          START YOUR JOURNEY
        </button>

        {/* Sign In Link */}
        <p style={{ fontSize: 14, color: '#68746F' }}>
          already have an account?{' '}
          <button 
            onClick={onSignIn}
            style={{ 
              color: '#32E89A', 
              fontWeight: 600, 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── Sign In Screen ───────────────────────────────────────────────
function SignInScreen({ onBack, onSwitchSignUp }: { onBack: () => void; onSwitchSignUp: () => void }) {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setError(null)
    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      router.replace('/home')
    }
  }

  return (
    <div className="animate-fade-up" style={{ padding: '60px 24px 40px', minHeight: '100dvh' }}>
      <FloatingOrbs />
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 32, padding: '8px 0' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M5 12l7 7M5 12l7-7" />
        </svg>
        Back
      </button>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--white)', marginBottom: 6 }}>Welcome back 👋</h2>
        <p style={{ fontSize: 15, color: 'var(--secondary)' }}>Sign in to continue your journey.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
          <input id="signin-email" className="rise-input" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
          <input id="signin-password" className="rise-input" type="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        <button id="signin-submit" className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--secondary)' }}>
        Don&apos;t have an account?{' '}
        <button onClick={onSwitchSignUp} style={{ color: 'var(--green)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          Create one
        </button>
      </p>
    </div>
  )
}

// ─── Sign Up Screen ───────────────────────────────────────────────
function SignUpScreen({ onBack, onSwitchSignIn }: { onBack: () => void; onSwitchSignIn: () => void }) {
  const { signUp, signIn } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError(null)
    const { error: signUpErr } = await signUp(name.trim(), email, password)
    if (signUpErr) {
      setError(signUpErr)
      setLoading(false)
      return
    }
    const { error: signInErr } = await signIn(email, password)
    if (signInErr) {
      setError('Account created! Please sign in.')
      setLoading(false)
    } else {
      router.replace('/home')
    }
  }

  return (
    <div className="animate-fade-up" style={{ padding: '60px 24px 40px', minHeight: '100dvh' }}>
      <FloatingOrbs />
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 32, padding: '8px 0' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M5 12l7 7M5 12l7-7" />
        </svg>
        Back
      </button>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--white)', marginBottom: 6 }}>Begin your journey ✨</h2>
        <p style={{ fontSize: 15, color: 'var(--secondary)' }}>Create your free account and start writing.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Name</label>
          <input id="signup-name" className="rise-input" type="text" placeholder="Alex Johnson" autoComplete="name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
          <input id="signup-email" className="rise-input" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
          <input id="signup-password" className="rise-input" type="password" placeholder="Min. 6 characters" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        <button id="signup-submit" className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Creating account…' : 'Create Free Account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--secondary)' }}>
        Already have an account?{' '}
        <button onClick={onSwitchSignIn} style={{ color: 'var(--green)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          Sign in
        </button>
      </p>
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--secondary)', lineHeight: 1.5 }}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────
export default function LandingClient() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('hero')

  useEffect(() => {
    if (!loading && user) {
      router.replace('/home')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--border)', borderTop: '2px solid var(--green)', animation: 'lspin 0.8s linear infinite' }} />
        <style>{`@keyframes lspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {screen === 'hero'   && <HeroScreen   onSignIn={() => setScreen('signin')} onSignUp={() => setScreen('signup')} />}
      {screen === 'signin' && <SignInScreen  onBack={() => setScreen('hero')} onSwitchSignUp={() => setScreen('signup')} />}
      {screen === 'signup' && <SignUpScreen  onBack={() => setScreen('hero')} onSwitchSignIn={() => setScreen('signin')} />}
    </div>
  )
}
