'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns'
import { useAuth } from '@/context/AuthContext'
import { useJournal, Challenge } from '@/context/JournalContext'
import { QUOTES } from '@/lib/quotes'
import RiseNavbar from '@/components/RiseNavbar'

export default function HomeClient() {
  const router = useRouter()
  const { profile, user, loading: authLoading } = useAuth()
  const { entries, stats, tasks, challenges, addTask, toggleTask, ensureDefaultTasks } = useJournal()
  const [currentQuote] = useState(QUOTES[0])
  const [weekDays, setWeekDays] = useState<Date[]>([])
  const [newTaskText, setNewTaskText] = useState('')
  const [taskError, setTaskError] = useState<string | null>(null)
  const [addingTask, setAddingTask] = useState(false)

  useEffect(() => {
    const today = new Date()
    const start = startOfWeek(today, { weekStartsOn: 0 })
    const end = endOfWeek(today, { weekStartsOn: 0 })
    setWeekDays(eachDayOfInterval({ start, end }))
  }, [])

  useEffect(() => {
    if (user && !authLoading) {
      ensureDefaultTasks()
    }
  }, [user, authLoading, ensureDefaultTasks])

  const handleWriteEntry = () => {
    router.push('/journal/new')
  }

  const getDayStatus = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    const hasEntry = !!entries[dateKey]
    const isTodayDate = isToday(date)
    
    if (isTodayDate) return 'today'
    if (hasEntry) return 'completed'
    return 'empty'
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const userName = profile?.name || profile?.email?.split('@')[0] || 'Friend'

  const handleAddTask = async () => {
    if (authLoading) {
      setTaskError('Still loading your session. Try again in a moment.')
      return
    }
    if (!user) {
      setTaskError('Please sign in to add tasks.')
      return
    }
    if (!newTaskText.trim()) return

    setAddingTask(true)
    setTaskError(null)
    const { error } = await addTask(newTaskText.trim())
    setAddingTask(false)

    if (error) {
      setTaskError(error)
      return
    }
    setNewTaskText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTask()
    }
  }

  const handleToggleTask = async (id: string) => {
    await toggleTask(id)
  }

  return (
    <div className="min-h-screen bg-[#020B08] pb-24 md:pb-0 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-[#AAB5B1]">{getGreeting()},</p>
            <h1 className="text-2xl md:text-4xl font-bold text-[#F5F7F6] flex items-center gap-2">
              {userName} <span className="text-[#32E89A] text-xl md:text-2xl">☼</span>
            </h1>
          </div>
          <p className="text-sm text-[#68746F]">A new day, a new opportunity to grow.</p>
        </div>

        {/* Date Selector */}
        <div className="mb-6 md:mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 md:justify-center">
            {weekDays.map((date, idx) => {
              const status = getDayStatus(date)
              const dayName = format(date, 'EEE').toUpperCase()
              const dayNum = format(date, 'd')
              
              return (
                <button
                  key={idx}
                  className={`flex flex-col items-center py-3 px-4 md:px-6 rounded-xl transition-all min-w-[50px] md:min-w-[60px] ${
                    status === 'today'
                      ? 'bg-[#32E89A] text-[#020B08] shadow-[0_0_20px_rgba(56,242,160,0.3)]'
                      : 'bg-[#0D1916] text-[#AAB5B1] border border-[rgba(100,255,190,0.12)]'
                  }`}
                >
                  <span className="text-xs md:text-sm font-semibold">{dayName}</span>
                  <span className="text-lg md:text-xl font-bold mt-1">{dayNum}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Write Entry CTA */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={handleWriteEntry}
            className="w-full md:w-auto md:min-w-[300px] py-4 rounded-full bg-[#32E89A] text-[#020B08] flex items-center justify-center gap-3 font-bold text-base shadow-[0_0_30px_rgba(56,242,160,0.3)] hover:shadow-[0_0_40px_rgba(56,242,160,0.4)] transition-all mx-auto"
          >
            <span className="text-xl">✎</span>
            Write Today&apos;s Entry
          </button>
        </div>

        {/* Daily Tasks */}
        <div className="mb-6 md:mb-8">
          <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[#32E89A]">🎯</span>
                <h3 className="text-sm md:text-base font-bold text-[#F5F7F6]">Daily Tasks</h3>
              </div>
              <span className="text-xs text-[#68746F]">{tasks.filter(t => t.completed).length}/{tasks.length} completed</span>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#061713] hover:bg-[#0B1914] transition-colors"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    task.completed
                      ? 'bg-[#32E89A] border-[#32E89A] text-[#020B08]'
                      : 'border-[rgba(100,255,190,0.3)]'
                  }`}>
                    {task.completed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm md:text-base ${task.completed ? 'text-[#68746F] line-through' : 'text-[#F5F7F6]'}`}>
                    {task.text}
                  </span>
                </button>
              ))}
              
              {taskError && (
                <p className="text-sm text-red-400">{taskError}</p>
              )}

              {/* Add New Task */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new task..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={addingTask || authLoading}
                  className="flex-1 bg-[#061713] border border-[rgba(100,255,190,0.12)] rounded-xl px-4 py-3 text-sm md:text-base text-[#F5F7F6] placeholder-[#68746F] outline-none focus:border-[#32E89A] transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={addingTask || authLoading || !newTaskText.trim()}
                  className="px-4 py-3 bg-[#32E89A] text-[#020B08] rounded-xl font-semibold text-sm md:text-base hover:bg-[#48EFA6] transition-colors disabled:opacity-50"
                >
                  {addingTask ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Winter Challenge */}
        <div className="mb-6 md:mb-8">
          {challenges.length > 0 ? (
            challenges.map((challenge: Challenge) => {
              const progress = (challenge.days_completed / challenge.total_days) * 100
              const remaining = challenge.total_days - challenge.days_completed
              return (
                <div key={challenge.id} className="bg-gradient-to-br from-[#0D1916] to-[#061713] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#32E89A]/5 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">❄️</span>
                      <h3 className="text-sm md:text-base font-bold text-[#F5F7F6]">{challenge.name}</h3>
                      <span className="ml-auto text-xs font-semibold text-[#32E89A] bg-[#32E89A]/10 px-2 py-1 rounded-full">
                        Day {challenge.days_completed}/{challenge.total_days}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-[#AAB5B1] mb-4">
                      {challenge.description}
                    </p>
                    <div className="w-full bg-[#061713] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#32E89A] h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-[#68746F] mt-2">{challenge.days_completed} days completed • {remaining} days remaining</p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-gradient-to-br from-[#0D1916] to-[#061713] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#32E89A]/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">❄️</span>
                  <h3 className="text-sm md:text-base font-bold text-[#F5F7F6]">Winter Challenge</h3>
                </div>
                <p className="text-sm md:text-base text-[#AAB5B1]">
                  No active challenge. Start journaling to unlock challenges!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Today's Inspiration */}
            <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#32E89A]">☀</span>
                <h3 className="text-sm font-bold text-[#F5F7F6]">Today&apos;s Inspiration</h3>
              </div>
              <p className="text-sm md:text-base text-[#AAB5B1] italic leading-relaxed">
                “{currentQuote.text}”
              </p>
              <p className="text-xs md:text-sm text-[#68746F] mt-2">— {currentQuote.author}</p>
            </div>

            {/* Streak Section */}
            <div>
              <h2 className="text-sm font-bold text-[#F5F7F6] mb-3">Your Streak</h2>
              <div className="bg-[#0D1916] rounded-2xl p-5 border border-[rgba(100,255,190,0.12)] mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl md:text-3xl">🔥</span>
                    <div>
                      <div className="text-2xl md:text-3xl font-bold text-[#32E89A]">{stats.currentStreak} Days</div>
                      <div className="text-xs md:text-sm text-[#68746F]">Keep going!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats Cards */}
          <div>
            <h2 className="text-sm font-bold text-[#F5F7F6] mb-3">Statistics</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-[#0D1916] rounded-2xl p-4 md:p-5 border border-[rgba(100,255,190,0.12)]">
                <div className="text-xs text-[#68746F] mb-1">Total Entries</div>
                <div className="text-xl md:text-2xl font-bold text-[#32E89A]">{stats.totalEntries}</div>
              </div>
              <div className="bg-[#0D1916] rounded-2xl p-4 md:p-5 border border-[rgba(100,255,190,0.12)]">
                <div className="text-xs text-[#68746F] mb-1">This Month</div>
                <div className="text-xl md:text-2xl font-bold text-[#32E89A]">{stats.thisMonth}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RiseNavbar />
    </div>
  )
}
