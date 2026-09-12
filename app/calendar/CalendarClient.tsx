'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { useJournal } from '@/context/JournalContext'
import RiseNavbar from '@/components/RiseNavbar'

export default function CalendarClient() {
  const { entries } = useJournal()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDateSelect = (date: Date) => setSelectedDate(date)

  const getEntryForDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    return entries[dateKey]
  }

  const selectedEntry = getEntryForDate(selectedDate)

  return (
    <div className="min-h-screen bg-[#020B08] pb-24 md:pb-0 md:pt-20">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button onClick={handlePreviousMonth} className="text-[#32E89A]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-2xl md:text-4xl font-bold text-[#F5F7F6]">Calendar</h1>
          <button onClick={handleNextMonth} className="text-[#32E89A]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Month Title */}
        <h2 className="text-lg md:text-2xl font-semibold text-[#F5F7F6] text-center mb-6 md:mb-8">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        {/* Calendar Grid */}
        <div className="bg-[#0D1916] rounded-2xl p-4 md:p-6 border border-[rgba(100,255,190,0.12)] mb-6 md:mb-8">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs md:text-sm font-semibold text-[#68746F]">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date) => {
              const entry = getEntryForDate(date)
              const isSelected = isSameDay(date, selectedDate)
              const isTodayDate = isToday(date)
              const hasEntry = !!entry

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateSelect(date)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm md:text-base font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#32E89A] text-[#020B08] shadow-[0_0_15px_rgba(56,242,160,0.3)]'
                      : isTodayDate
                      ? 'bg-[#32E89A]/20 text-[#32E89A] border border-[#32E89A]'
                      : hasEntry
                      ? 'bg-[#0D1916] text-[#F5F7F6] border border-[rgba(100,255,190,0.3)]'
                      : 'bg-[#061713] text-[#68746F]'
                  }`}
                >
                  {format(date, 'd')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Entry */}
        {selectedEntry && (
          <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-[#32E89A]">
                  {format(selectedDate, 'EEE').toUpperCase()}
                </span>
                <span className="text-2xl md:text-3xl font-bold text-[#F5F7F6]">
                  {format(selectedDate, 'd')}
                </span>
              </div>
              <div className="w-px h-12 md:h-16 bg-[rgba(100,255,190,0.12)]" />
            </div>
            
            <h3 className="text-base md:text-lg font-semibold text-[#F5F7F6] mb-2">
              {selectedEntry.title || 'Untitled Entry'}
            </h3>
            <p className="text-sm md:text-base text-[#AAB5B1] line-clamp-3">
              {selectedEntry.content || 'No content...'}
            </p>
          </div>
        )}
      </div>

      <RiseNavbar />
    </div>
  )
}
