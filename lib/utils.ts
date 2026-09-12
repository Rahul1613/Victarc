import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  parseISO,
  isToday,
  isThisWeek,
  isThisMonth,
  differenceInCalendarDays,
  subDays,
} from 'date-fns'
import type { JournalEntry, JournalStats } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert a Date or ISO string to 'YYYY-MM-DD' */
export function toDateKey(d: Date | string): string {
  const date = typeof d === 'string' ? parseISO(d) : d
  return format(date, 'yyyy-MM-dd')
}

/** Compute streak and stats from an array of journal entries */
export function computeStats(entries: JournalEntry[]): JournalStats {
  if (!entries.length) {
    return {
      totalEntries: 0,
      currentStreak: 0,
      longestStreak: 0,
      thisMonth: 0,
      thisWeek: 0,
      today: 0,
    }
  }

  const dates = entries.map((e) => e.date).sort().reverse()
  const dateSet = new Set(dates)

  // Current streak
  let currentStreak = 0
  let checkDate = new Date()
  // If no entry today, start checking from yesterday
  if (!dateSet.has(toDateKey(checkDate))) {
    checkDate = subDays(checkDate, 1)
  }
  while (dateSet.has(toDateKey(checkDate))) {
    currentStreak++
    checkDate = subDays(checkDate, 1)
  }

  // Longest streak
  let longestStreak = 0
  let runStreak = 1
  for (let i = 0; i < dates.length - 1; i++) {
    const diff = differenceInCalendarDays(parseISO(dates[i]), parseISO(dates[i + 1]))
    if (diff === 1) {
      runStreak++
      longestStreak = Math.max(longestStreak, runStreak)
    } else {
      runStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, runStreak)

  const today = entries.filter((e) => isToday(parseISO(e.date))).length
  const thisWeek = entries.filter((e) => isThisWeek(parseISO(e.date), { weekStartsOn: 1 })).length
  const thisMonth = entries.filter((e) => isThisMonth(parseISO(e.date))).length

  return {
    totalEntries: entries.length,
    currentStreak,
    longestStreak,
    thisMonth,
    thisWeek,
    today,
  }
}
