// ============================================================
// RISE JOURNAL — Core Types
// ============================================================

export type ThemeMode = 'dark' | 'light' | 'system'

export interface JournalEntry {
  id: string
  user_id: string
  date: string // 'YYYY-MM-DD'
  title: string
  content: string // HTML string
  images: string[]
  links: string[]
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  bio: string
  avatar_url: string | null
  created_at: string
}

export interface AppSettings {
  theme: ThemeMode
  daily_reminder_enabled: boolean
  daily_reminder_time: string // 'HH:MM' e.g. '09:00'
}

export interface JournalStats {
  totalEntries: number
  currentStreak: number
  longestStreak: number
  thisMonth: number
  thisWeek: number
  today: number
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
