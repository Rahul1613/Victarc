'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { href: '/home', label: 'Home' },
  { href: '/stats', label: 'Stats' },
  { href: '/journal', label: 'Journal' },
  { href: '/profile', label: 'Profile' },
]

export default function RiseNavbar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#07130F]/95 backdrop-blur-xl border-t border-[#153A2D] md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20 md:h-16">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#38F2A0] text-[#002111] shadow-[0_0_20px_rgba(56,242,160,0.3)]'
                      : 'text-[#A8B1AE] hover:text-[#F5F7F6] hover:bg-[#252B29]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Logo (center on mobile, left on desktop) */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#38F2A0] shadow-[0_0_12px_#38f2a0]" />
            <span className="text-sm md:text-base font-semibold text-[#38F2A0] tracking-tight">arise by victarc</span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#252B29]">
              <span className="w-2 h-2 rounded-full bg-[#38F2A0] animate-pulse" />
              <span className="text-xs text-[#A8B1AE]">Synced</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs md:text-sm text-[#A8B1AE] hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all text-sm ${
                    isActive
                      ? 'bg-[#38F2A0] text-[#002111] shadow-[0_0_15px_rgba(56,242,160,0.4)]'
                      : 'text-[#A8B1AE]'
                  }`}
                >
                  {item.href === '/home' && '🏠'}
                  {item.href === '/stats' && '�'}
                  {item.href === '/journal' && '📝'}
                  {item.href === '/profile' && '👤'}
                </div>
                <span
                  className={`text-[10px] font-medium transition-all ${
                    isActive ? 'text-[#38F2A0]' : 'text-[#859588]'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
