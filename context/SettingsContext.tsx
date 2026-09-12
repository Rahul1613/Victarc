'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'
import type { AppSettings, ThemeMode } from '@/lib/types'
import { getCachedSettings, setCachedSettings, DEFAULT_SETTINGS } from '@/lib/storage'

interface SettingsContextValue {
  settings: AppSettings
  loading: boolean
  setTheme: (theme: ThemeMode) => Promise<void>
  setReminder: (enabled: boolean, time?: string) => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (theme === 'dark' || (theme === 'system' && prefersDark)) {
    root.classList.remove('light')
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
    root.classList.add('light')
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { user } = useAuth()
  const [settings, setSettings] = useState<AppSettings>(getCachedSettings())
  const [loading, setLoading] = useState(false)

  const fetchSettings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      const s: AppSettings = {
        theme: (data.theme as ThemeMode) || 'dark',
        daily_reminder_enabled: data.daily_reminder_enabled ?? false,
        daily_reminder_time: data.daily_reminder_time || '09:00',
      }
      setSettings(s)
      setCachedSettings(s)
      applyTheme(s.theme)
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    applyTheme(settings.theme)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (user) fetchSettings()
    else setSettings(getCachedSettings())
  }, [user, fetchSettings])

  const persist = async (patch: Partial<AppSettings>) => {
    const updated = { ...settings, ...patch }
    setSettings(updated)
    setCachedSettings(updated)
    applyTheme(updated.theme)

    if (user) {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        theme: updated.theme,
        daily_reminder_enabled: updated.daily_reminder_enabled,
        daily_reminder_time: updated.daily_reminder_time,
      }, { onConflict: 'user_id' })
    }
  }

  const setTheme = (theme: ThemeMode) => persist({ theme })
  const setReminder = (enabled: boolean, time?: string) =>
    persist({ daily_reminder_enabled: enabled, ...(time && { daily_reminder_time: time }) })
  const updateSettings = (patch: Partial<AppSettings>) => persist(patch)

  return (
    <SettingsContext.Provider value={{ settings, loading, setTheme, setReminder, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
