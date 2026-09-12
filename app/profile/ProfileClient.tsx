'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useJournal } from '@/context/JournalContext'
import RiseNavbar from '@/components/RiseNavbar'

export default function ProfileClient() {
  const { profile, signOut } = useAuth()
  const { entries } = useJournal()
  const router = useRouter()
  const [quote, setQuote] = useState('Progress, not perfection.')
  const [editingQuote, setEditingQuote] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false)
  const [dailyReminderTime, setDailyReminderTime] = useState('09:00')
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)

  const userName = profile?.name || profile?.email?.split('@')[0] || 'Friend'
  const userInitial = userName.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const handleExportJournal = () => {
    const entriesArray = Object.values(entries)
    const exportData = {
      exportDate: new Date().toISOString(),
      totalEntries: entriesArray.length,
      entries: entriesArray
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rise-journal-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setShowThemeModal(false)
    if (newTheme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('theme', newTheme)
    // TODO: Save to user_settings in Supabase
  }

  const handleReminderToggle = async () => {
    const newState = !dailyReminderEnabled
    setDailyReminderEnabled(newState)
    
    if (newState) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          localStorage.setItem('reminderEnabled', 'true')
        }
      }
    } else {
      localStorage.setItem('reminderEnabled', 'false')
    }
    // TODO: Save to user_settings in Supabase
  }

  const handleReminderTimeChange = (time: string) => {
    setDailyReminderTime(time)
    setShowReminderModal(false)
    localStorage.setItem('reminderTime', time)
    // TODO: Save to user_settings in Supabase
  }

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark'
    setTheme(savedTheme)
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }

    // Load saved reminder settings
    const savedReminderEnabled = localStorage.getItem('reminderEnabled') === 'true'
    const savedReminderTime = localStorage.getItem('reminderTime') || '09:00'
    setDailyReminderEnabled(savedReminderEnabled)
    setDailyReminderTime(savedReminderTime)
  }, [])

  useEffect(() => {
    // Set up reminder check
    if (dailyReminderEnabled && 'Notification' in window) {
      const checkReminder = () => {
        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        
        if (currentTime === dailyReminderTime && Notification.permission === 'granted') {
          new Notification('RISE Journal', {
            body: "Time to write your journal entry! 📝",
            icon: '/icon.png'
          })
        }
      }

      const interval = setInterval(checkReminder, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [dailyReminderEnabled, dailyReminderTime])

  return (
    <div className="min-h-screen bg-[#020B08] pb-24 md:pb-0 md:pt-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-[#F5F7F6]">Profile</h1>
          <button className="text-[#32E89A]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-[#0D1916] rounded-2xl p-6 md:p-8 border border-[rgba(100,255,190,0.12)] mb-6 md:mb-8">
          <div className="flex items-center gap-4 md:gap-6 mb-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#32E89A]/20 flex items-center justify-center text-2xl md:text-3xl font-bold text-[#32E89A]">
              {userInitial}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#F5F7F6]">{userName}</h2>
              <p className="text-sm md:text-base text-[#68746F]">{profile?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Quote Card */}
        <div className="bg-[#0D1916] rounded-2xl p-6 md:p-8 border border-[rgba(100,255,190,0.12)] mb-6 md:mb-8 relative">
          {editingQuote ? (
            <div>
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="w-full bg-[#061713] rounded-xl p-3 text-sm md:text-base text-[#F5F7F6] border border-[rgba(100,255,190,0.12)] resize-none"
                rows={2}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setEditingQuote(false)}
                  className="px-4 py-2 bg-[#32E89A] text-[#020B08] rounded-full text-xs md:text-sm font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingQuote(false)}
                  className="px-4 py-2 bg-[#061713] text-[#AAB5B1] rounded-full text-xs md:text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm md:text-base text-[#F5F7F6] italic mb-3">"{quote}"</p>
              <button
                onClick={() => setEditingQuote(true)}
                className="text-[#32E89A]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Settings List */}
        <div className="bg-[#0D1916] rounded-2xl border border-[rgba(100,255,190,0.12)] overflow-hidden">
          <SettingRow 
            icon="🔔" 
            label="Daily Reminder" 
            value={dailyReminderEnabled ? dailyReminderTime : 'Off'} 
            chevron 
            onClick={() => setShowReminderModal(true)}
          />
          <SettingRow 
            icon="🎨" 
            label="Theme" 
            value={theme.charAt(0).toUpperCase() + theme.slice(1)} 
            chevron 
            onClick={() => setShowThemeModal(true)}
          />
          <SettingRow icon="☁️" label="Backup & Sync" value="On" chevron />
          <SettingRow icon="📤" label="Export Journal" chevron onClick={handleExportJournal} />
          <SettingRow icon="❓" label="Help & Support" chevron onClick={() => router.push('/help')} />
          <SettingRow icon="ℹ️" label="About RISE" chevron onClick={() => router.push('/about')} />
          <SettingRow icon="🚪" label="Sign Out" onClick={handleSignOut} danger />
        </div>
      </div>

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowThemeModal(false)}>
          <div className="bg-[#0D1916] rounded-2xl p-6 border border-[rgba(100,255,190,0.12)] max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#F5F7F6] mb-4">Select Theme</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-[#32E89A] bg-[#32E89A]/10' 
                    : 'border-[rgba(100,255,190,0.12)] hover:border-[rgba(100,255,190,0.3)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#020B08] border border-[rgba(100,255,190,0.3)]" />
                  <span className="text-[#F5F7F6]">Dark</span>
                </div>
              </button>
              <button
                onClick={() => handleThemeChange('light')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-[#32E89A] bg-[#32E89A]/10' 
                    : 'border-[rgba(100,255,190,0.12)] hover:border-[rgba(100,255,190,0.3)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F5F7F6] border border-[rgba(0,0,0,0.1)]" />
                  <span className="text-[#F5F7F6]">Light</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReminderModal(false)}>
          <div className="bg-[#0D1916] rounded-2xl p-6 border border-[rgba(100,255,190,0.12)] max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#F5F7F6] mb-4">Daily Reminder</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#F5F7F6]">Enable Reminder</span>
                <button
                  onClick={handleReminderToggle}
                  className={`w-12 h-6 rounded-full transition-all ${
                    dailyReminderEnabled ? 'bg-[#32E89A]' : 'bg-[#061713]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-all ${
                      dailyReminderEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              {dailyReminderEnabled && (
                <div>
                  <label className="text-sm text-[#AAB5B1] block mb-2">Reminder Time</label>
                  <input
                    type="time"
                    value={dailyReminderTime}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="w-full bg-[#061713] border border-[rgba(100,255,190,0.12)] rounded-xl px-4 py-3 text-[#F5F7F6]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <RiseNavbar />
    </div>
  )
}

function SettingRow({
  icon,
  label,
  value,
  chevron = false,
  onClick,
  danger = false,
}: {
  icon: string
  label: string
  value?: string
  chevron?: boolean
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 py-4 border-b border-[rgba(100,255,190,0.08)] last:border-0 hover:bg-[rgba(100,255,190,0.05)] transition-colors ${
        danger ? 'text-[#ef4444]' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-[#F5F7F6]">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-sm text-[#68746F]">{value}</span>}
        {chevron && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#68746F]">
            <path d="M9 18l6-6-6-6" />
          </svg>
        )}
      </div>
    </button>
  )
}
