'use client'

import { useState } from 'react'
import { useJournal } from '@/context/JournalContext'
import RiseNavbar from '@/components/RiseNavbar'

type TimeRange = '7 Days' | '30 Days' | '3 Months' | '1 Year' | 'All Time'

export default function StatsClient() {
  const { entries } = useJournal()
  const [timeRange, setTimeRange] = useState<TimeRange>('7 Days')

  const entriesArray = Object.values(entries)
  const totalEntries = entriesArray.length
  const currentStreak = calculateCurrentStreak(entriesArray)
  const longestStreak = calculateLongestStreak(entriesArray)
  const daysThisMonth = calculateDaysThisMonth(entriesArray)

  return (
    <div className="min-h-screen bg-[#020B08] pb-24 md:pb-0 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-6 md:mb-8">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <defs>
                <linearGradient id="statsMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#32E89A', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#0B241C', stopOpacity: 0.1 }} />
                </linearGradient>
              </defs>
              <path d="M200 30 L300 150 L100 150 Z" fill="url(#statsMountainGrad)" />
              <path d="M200 30 L300 150 L350 180 L50 180 L100 150 Z" fill="url(#statsMountainGrad)" />
            </svg>
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-[#32E89A] tracking-wider mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              RISE
            </h1>
            <p className="text-sm md:text-base font-semibold text-[#AAB5B1] tracking-widest mb-1">
              JOURNAL
            </p>
            <p className="text-xs md:text-sm text-[#68746F] tracking-wider">
              CONSISTENCY CREATES FREEDOM
            </p>
            <div className="absolute right-0 top-0 text-right">
              <p className="text-sm md:text-base font-bold text-[#32E89A]">
                A BETTER YOU
              </p>
              <p className="text-xs md:text-sm text-[#68746F]">
                EVERY DAY
              </p>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 md:mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 md:justify-center">
            {(['7 Days', '30 Days', '3 Months', '1 Year', 'All Time'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                  timeRange === range
                    ? 'bg-[#32E89A] text-[#020B08]'
                    : 'bg-[#0D1916] text-[#AAB5B1] border border-[rgba(100,255,190,0.12)]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatCard icon="📖" value={totalEntries} label="Total Entries" message="Keep going." />
          <StatCard icon="🔥" value={`${currentStreak} Days`} label="Current Streak" message="You're on fire!" />
          <StatCard icon="⭐" value={`${longestStreak} Days`} label="Longest Streak" message="Your best!" />
          <StatCard icon="📊" value={daysThisMonth} label="Days This Month" message="Great progress." />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <ChartCard title="Writing Activity" dropdown="This Month" type="bar" />
          <ChartCard title="Mood Tracker" dropdown="This Month" type="line" />
        </div>

        {/* Writing Topics */}
        <div className="mb-6 md:mb-8">
          <TopicsCard />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
          <InsightCard title="Most Active Day" value="Thursday" message="You write the most on Thursdays!" />
          <InsightCard title="Average Words per Entry" value="324" message="Your thoughts matter!" />
          <InsightCard title="Total Writing Time" value="4h 32m" message="Time well spent!" />
        </div>

        {/* Motivational Quote */}
        <div className="mb-6 md:mb-8">
          <QuoteCard text="A small step today, leads to big results tomorrow." author="Unknown" />
        </div>
      </div>

      <RiseNavbar />
    </div>
  )
}

// Helper Components
function StatCard({ icon, value, label, message }: { icon: string; value: number | string; label: string; message: string }) {
  return (
    <div className="bg-[#0D1916] rounded-2xl p-4 md:p-5 border border-[rgba(100,255,190,0.12)]">
      <div className="text-2xl md:text-3xl mb-2">{icon}</div>
      <div className="text-2xl md:text-3xl font-bold text-[#32E89A] mb-1">{value}</div>
      <div className="text-xs md:text-sm font-semibold text-[#AAB5B1] mb-2">{label}</div>
      <div className="text-xs text-[#68746F]">{message}</div>
    </div>
  )
}

function ChartCard({ title, dropdown, type }: { title: string; dropdown: string; type: 'bar' | 'line' }) {
  return (
    <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm md:text-base font-bold text-[#F5F7F6]">{title}</h3>
        <button className="text-xs md:text-sm text-[#AAB5B1] flex items-center gap-1">
          {dropdown}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      <div className="h-40 md:h-48 flex items-end justify-between gap-1">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-[#32E89A]/20 rounded-t transition-all hover:bg-[#32E89A]/40"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-[#68746F]">
        <span>1</span>
        <span>15</span>
        <span>30</span>
      </div>
    </div>
  )
}

function TopicsCard() {
  const topics = [
    { name: 'Self Improvement', count: 8 },
    { name: 'Gratitude', count: 5 },
    { name: 'Work / Study', count: 4 },
    { name: 'Family & Friends', count: 4 },
    { name: 'Health / Fitness', count: 3 },
    { name: 'General', count: 4 },
  ]

  return (
    <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm md:text-base font-bold text-[#F5F7F6]">Writing Topics</h3>
        <button className="text-xs md:text-sm text-[#AAB5B1] flex items-center gap-1">
          This Month
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      <div className="space-y-3">
        {topics.map((topic) => (
          <div key={topic.name}>
            <div className="flex justify-between text-xs md:text-sm mb-1">
              <span className="text-[#AAB5B1]">{topic.name}</span>
              <span className="text-[#32E89A] font-semibold">{topic.count}</span>
            </div>
            <div className="h-2 bg-[#061713] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#32E89A] rounded-full transition-all"
                style={{ width: `${(topic.count / 8) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightCard({ title, value, message }: { title: string; value: string; message: string }) {
  return (
    <div className="bg-[#0D1916] rounded-2xl p-5 border border-[rgba(100,255,190,0.12)]">
      <div className="text-xs text-[#68746F] mb-2">{title}</div>
      <div className="text-lg md:text-xl font-bold text-[#32E89A] mb-1">{value}</div>
      <div className="text-xs md:text-sm text-[#AAB5B1]">{message}</div>
    </div>
  )
}

function QuoteCard({ text, author }: { text: string; author: string }) {
  return (
    <div className="bg-[#0D1916] rounded-2xl p-6 border border-[rgba(100,255,190,0.12)] relative overflow-hidden">
      <div className="absolute top-4 right-4 text-4xl text-[#32E89A]/20 font-serif">"</div>
      <p className="text-sm md:text-base text-[#F5F7F6] italic mb-3 leading-relaxed">{text}</p>
      <p className="text-xs md:text-sm text-[#68746F]">— {author}</p>
    </div>
  )
}

// Helper functions
function calculateCurrentStreak(entries: any[]): number {
  if (entries.length === 0) return 0
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === streak) {
      streak++
      currentDate = entryDate
    } else if (diffDays > streak) {
      break
    }
  }
  
  return streak
}

function calculateLongestStreak(entries: any[]): number {
  if (entries.length === 0) return 0
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let longestStreak = 0
  let currentStreak = 0
  let lastDate: Date | null = null
  
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)
    
    if (lastDate === null) {
      currentStreak = 1
    } else {
      const diffDays = Math.floor((entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        currentStreak++
      } else if (diffDays > 1) {
        currentStreak = 1
      }
    }
    
    longestStreak = Math.max(longestStreak, currentStreak)
    lastDate = entryDate
  }
  
  return longestStreak
}

function calculateDaysThisMonth(entries: any[]): number {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const uniqueDays = new Set(
    entries
      .filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear
      })
      .map((entry) => entry.date.toString())
  )
  
  return uniqueDays.size
}
