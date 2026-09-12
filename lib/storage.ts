// ============================================================
// RISE JOURNAL — localStorage helpers (offline cache)
// ============================================================

import type { JournalEntry, UserProfile, AppSettings } from './types'

export interface CachedDailyTask {
  id: string
  user_id: string
  text: string
  completed: boolean
  date: string
  created_at: string
  updated_at: string
}

const KEYS = {
  ENTRIES: 'rise_entries',
  PROFILE: 'rise_profile',
  SETTINGS: 'rise_settings',
  ONBOARDED: 'rise_onboarded',
  TASKS: 'rise_tasks',
} as const

function taskCacheKey(userId: string, date: string) {
  return `${userId}:${date}`
}

// ─── Entries ─────────────────────────────────────────────────

export function getCachedEntries(): Record<string, JournalEntry> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEYS.ENTRIES)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setCachedEntry(entry: JournalEntry): void {
  if (typeof window === 'undefined') return
  try {
    const all = getCachedEntries()
    all[entry.date] = entry
    localStorage.setItem(KEYS.ENTRIES, JSON.stringify(all))
  } catch { /* quota exceeded — ignore */ }
}

export function deleteCachedEntry(date: string): void {
  if (typeof window === 'undefined') return
  try {
    const all = getCachedEntries()
    delete all[date]
    localStorage.setItem(KEYS.ENTRIES, JSON.stringify(all))
  } catch { /* ignore */ }
}

export function setCachedEntries(entries: JournalEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    const map: Record<string, JournalEntry> = {}
    entries.forEach(e => { map[e.date] = e })
    localStorage.setItem(KEYS.ENTRIES, JSON.stringify(map))
  } catch { /* ignore */ }
}

// ─── Daily Tasks ──────────────────────────────────────────────

export function getCachedTasks(userId: string, date: string): CachedDailyTask[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEYS.TASKS)
    if (!raw) return []
    const all: Record<string, CachedDailyTask[]> = JSON.parse(raw)
    return all[taskCacheKey(userId, date)] || []
  } catch {
    return []
  }
}

export function setCachedTasks(userId: string, date: string, tasks: CachedDailyTask[]): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(KEYS.TASKS)
    const all: Record<string, CachedDailyTask[]> = raw ? JSON.parse(raw) : {}
    all[taskCacheKey(userId, date)] = tasks
    localStorage.setItem(KEYS.TASKS, JSON.stringify(all))
  } catch { /* ignore */ }
}

// ─── Profile ──────────────────────────────────────────────────

export function getCachedProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEYS.PROFILE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile))
  } catch { /* ignore */ }
}

export function clearCachedProfile(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.PROFILE)
}

// ─── Settings ─────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  daily_reminder_enabled: false,
  daily_reminder_time: '09:00',
}

export function getCachedSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function setCachedSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
  } catch { /* ignore */ }
}

// ─── Onboarding flag ──────────────────────────────────────────

export function getOnboarded(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(KEYS.ONBOARDED) === 'true'
}

export function setOnboarded(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.ONBOARDED, 'true')
}

export function clearAll(): void {
  if (typeof window === 'undefined') return
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
