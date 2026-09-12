'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'
import type { JournalEntry, JournalStats } from '@/lib/types'
import {
  getCachedEntries, setCachedEntry, deleteCachedEntry, setCachedEntries,
  getCachedTasks, setCachedTasks,
} from '@/lib/storage'
import { computeStats, toDateKey } from '@/lib/utils'

export const DEFAULT_DAILY_TASKS = [
  'Completed workout',
  'Read 10 pages',
  'Learned something new',
  'Stayed positive',
]

export interface DailyTask {
  id: string
  user_id: string
  text: string
  completed: boolean
  date: string
  created_at: string
  updated_at: string
}

export interface Challenge {
  id: string
  user_id: string
  name: string
  description: string
  start_date: string
  end_date: string
  days_completed: number
  total_days: number
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  updated_at: string
}

interface JournalContextValue {
  entries: Record<string, JournalEntry>      // keyed by 'YYYY-MM-DD'
  stats: JournalStats
  loading: boolean
  tasks: DailyTask[]
  challenges: Challenge[]
  getEntry: (date: string) => JournalEntry | null
  upsertEntry: (date: string, title: string, content: string) => Promise<{ error: string | null }>
  deleteEntry: (date: string) => Promise<{ error: string | null }>
  searchEntries: (query: string) => JournalEntry[]
  refreshEntries: () => Promise<void>
  addTask: (text: string) => Promise<{ error: string | null; data?: DailyTask }>
  toggleTask: (id: string) => Promise<{ error: string | null }>
  updateTask: (id: string, text: string) => Promise<{ error: string | null }>
  deleteTask: (id: string) => Promise<{ error: string | null }>
  ensureDefaultTasks: () => Promise<{ error: string | null }>
  refreshTasks: () => Promise<void>
  refreshChallenges: () => Promise<void>
}

const JournalContext = createContext<JournalContextValue | null>(null)

const EMPTY_STATS: JournalStats = {
  totalEntries: 0, currentStreak: 0, longestStreak: 0, thisMonth: 0, thisWeek: 0, today: 0,
}

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { user } = useAuth()
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({})
  const [stats, setStats] = useState<JournalStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])

  const computeAndSetStats = useCallback((map: Record<string, JournalEntry>) => {
    setStats(computeStats(Object.values(map)))
  }, [])

  const fetchEntries = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // Immediately use cache
    const cached = getCachedEntries()
    setEntries(cached)
    computeAndSetStats(cached)

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (!error && data) {
      const map: Record<string, JournalEntry> = {}
      data.forEach((row: JournalEntry) => { map[row.date] = row })
      setEntries(map)
      computeAndSetStats(map)
      setCachedEntries(data)
    }
    setLoading(false)
  }, [user, supabase, computeAndSetStats])

  const saveTasks = useCallback((userId: string, date: string, nextTasks: DailyTask[]) => {
    setTasks(nextTasks)
    setCachedTasks(userId, date, nextTasks)
  }, [])

  const fetchTasks = useCallback(async () => {
    if (!user) return
    const today = toDateKey(new Date())
    const cached = getCachedTasks(user.id, today)
    if (cached.length > 0) {
      setTasks(cached as DailyTask[])
    }

    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true })

    if (!error && data && data.length > 0) {
      saveTasks(user.id, today, data)
    } else if (!error && data && data.length === 0 && cached.length === 0) {
      setTasks([])
    }
  }, [user, supabase, saveTasks])

  const fetchChallenges = useCallback(async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setChallenges(data)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      fetchEntries()
      fetchTasks()
      fetchChallenges()
    } else {
      setEntries({})
      setStats(EMPTY_STATS)
      setTasks([])
      setChallenges([])
    }
  }, [user, fetchEntries, fetchTasks, fetchChallenges])

  const getEntry = (date: string) => entries[date] || null

  const upsertEntry = async (date: string, title: string, content: string) => {
    if (!user) return { error: 'Not signed in' }

    const existing = entries[date]
    const now = new Date().toISOString()
    const entry: JournalEntry = {
      id: existing?.id || crypto.randomUUID(),
      user_id: user.id,
      date,
      title,
      content,
      images: existing?.images || [],
      links: existing?.links || [],
      created_at: existing?.created_at || now,
      updated_at: now,
    }

    // Optimistic update
    const updated = { ...entries, [date]: entry }
    setEntries(updated)
    computeAndSetStats(updated)
    setCachedEntry(entry)

    const { error } = await supabase
      .from('journal_entries')
      .upsert({
        user_id: user.id,
        date,
        title,
        content,
        images: entry.images,
        links: entry.links,
      }, { onConflict: 'user_id,date' })

    return { error: error?.message || null }
  }

  const deleteEntry = async (date: string) => {
    if (!user) return { error: 'Not signed in' }

    // Optimistic update
    const updated = { ...entries }
    delete updated[date]
    setEntries(updated)
    computeAndSetStats(updated)
    deleteCachedEntry(date)

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('user_id', user.id)
      .eq('date', date)

    return { error: error?.message || null }
  }

  const searchEntries = (query: string): JournalEntry[] => {
    if (!query.trim()) return Object.values(entries).sort((a, b) => b.date.localeCompare(a.date))
    const q = query.toLowerCase()
    return Object.values(entries)
      .filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().replace(/<[^>]+>/g, ' ').includes(q)
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  const createLocalTask = (text: string, date: string): DailyTask => {
    const now = new Date().toISOString()
    return {
      id: crypto.randomUUID(),
      user_id: user!.id,
      text,
      completed: false,
      date,
      created_at: now,
      updated_at: now,
    }
  }

  const addTask = async (text: string) => {
    if (!user) return { error: 'Not signed in' }
    const trimmed = text.trim()
    if (!trimmed) return { error: 'Task text is required' }

    const today = toDateKey(new Date())
    const localTask = createLocalTask(trimmed, today)
    let nextTasks: DailyTask[] = []

    setTasks(prev => {
      nextTasks = [...prev, localTask]
      setCachedTasks(user.id, today, nextTasks)
      return nextTasks
    })

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert({
        user_id: user.id,
        text: trimmed,
        date: today,
        completed: false,
      })
      .select()
      .single()

    if (!error && data) {
      const synced = nextTasks.map(t => (t.id === localTask.id ? data : t))
      saveTasks(user.id, today, synced)
      return { error: null, data }
    }

    return { error: null, data: localTask }
  }

  const toggleTask = async (id: string) => {
    if (!user) return { error: 'Not signed in' }

    const today = toDateKey(new Date())
    let previousCompleted: boolean | null = null

    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      if (!task) return prev
      previousCompleted = task.completed
      const now = new Date().toISOString()
      const next = prev.map(t =>
        t.id === id ? { ...t, completed: !t.completed, updated_at: now } : t
      )
      setCachedTasks(user.id, today, next)
      return next
    })

    if (previousCompleted === null) return { error: 'Task not found' }

    await supabase
      .from('daily_tasks')
      .update({ completed: !previousCompleted })
      .eq('id', id)

    return { error: null }
  }

  const updateTask = async (id: string, text: string) => {
    if (!user) return { error: 'Not signed in' }
    const trimmed = text.trim()
    if (!trimmed) return { error: 'Task text is required' }

    const today = toDateKey(new Date())
    setTasks(prev => {
      const now = new Date().toISOString()
      const next = prev.map(t =>
        t.id === id ? { ...t, text: trimmed, updated_at: now } : t
      )
      setCachedTasks(user.id, today, next)
      return next
    })

    await supabase
      .from('daily_tasks')
      .update({ text: trimmed })
      .eq('id', id)

    return { error: null }
  }

  const deleteTask = async (id: string) => {
    if (!user) return { error: 'Not signed in' }

    const today = toDateKey(new Date())
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id)
      setCachedTasks(user.id, today, next)
      return next
    })

    await supabase
      .from('daily_tasks')
      .delete()
      .eq('id', id)

    return { error: null }
  }

  const ensureDefaultTasks = useCallback(async () => {
    if (!user) return { error: 'Not signed in' }

    const today = toDateKey(new Date())
    const cached = getCachedTasks(user.id, today)
    if (cached.length > 0) {
      setTasks(cached as DailyTask[])
      return { error: null }
    }

    const { count, error: countError } = await supabase
      .from('daily_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('date', today)

    if (!countError && count && count > 0) return { error: null }

    const now = new Date().toISOString()
    const localDefaults: DailyTask[] = DEFAULT_DAILY_TASKS.map(text => ({
      id: crypto.randomUUID(),
      user_id: user.id,
      text,
      completed: false,
      date: today,
      created_at: now,
      updated_at: now,
    }))

    if (countError) {
      saveTasks(user.id, today, localDefaults)
      return { error: null }
    }

    const rows = DEFAULT_DAILY_TASKS.map(text => ({
      user_id: user.id,
      text,
      date: today,
      completed: false,
    }))

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert(rows)
      .select()

    if (!error && data) {
      saveTasks(user.id, today, data)
      return { error: null }
    }

    saveTasks(user.id, today, localDefaults)
    return { error: null }
  }, [user, supabase, saveTasks])

  const refreshTasks = async () => {
    await fetchTasks()
  }

  const refreshChallenges = async () => {
    await fetchChallenges()
  }

  return (
    <JournalContext.Provider value={{
      entries, stats, loading, tasks, challenges,
      getEntry, upsertEntry, deleteEntry, searchEntries,
      refreshEntries: fetchEntries,
      addTask, toggleTask, updateTask, deleteTask, ensureDefaultTasks, refreshTasks, refreshChallenges,
    }}>
      {children}
    </JournalContext.Provider>
  )
}

export function useJournal() {
  const ctx = useContext(JournalContext)
  if (!ctx) throw new Error('useJournal must be used within JournalProvider')
  return ctx
}
