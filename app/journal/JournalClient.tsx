'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { useJournal } from '@/context/JournalContext'
import RiseNavbar from '@/components/RiseNavbar'

export default function JournalClient() {
  const router = useRouter()
  const { entries } = useJournal()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const entriesArray = Object.values(entries).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const filteredEntries = entriesArray.filter(entry => {
    const query = searchQuery.toLowerCase()
    return (
      entry.title?.toLowerCase().includes(query) ||
      entry.content?.toLowerCase().includes(query)
    )
  })

  const handleNewEntry = () => {
    router.push('/journal/new')
  }

  const handleCalendar = () => {
    router.push('/calendar')
  }

  return (
    <div className="min-h-screen bg-[#020B08] pb-24 md:pb-0 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-[#F5F7F6] mb-4 md:mb-0">My Journal</h1>
          <div className="flex items-center gap-3">
            <button className="text-[#AAB5B1]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button onClick={handleCalendar} className="text-[#AAB5B1]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center mb-6 md:mb-8">
          <button className="text-[#32E89A] mr-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="text-lg md:text-2xl font-semibold text-[#F5F7F6]">
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          <button className="text-[#32E89A] ml-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 md:mb-8 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D1916] border border-[rgba(100,255,190,0.12)] rounded-xl px-4 py-3 text-sm md:text-base text-[#F5F7F6] placeholder-[#68746F]"
          />
        </div>

        {/* Entry List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredEntries.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-sm md:text-base text-[#68746F] mb-4">No entries yet</p>
              <button
                onClick={handleNewEntry}
                className="px-6 py-3 bg-[#32E89A] text-[#020B08] rounded-full font-semibold"
              >
                Write your first entry
              </button>
            </div>
          ) : (
            filteredEntries.map((entry: any) => (
              <div
                key={entry.id}
                onClick={() => router.push(`/journal/${entry.id}`)}
                className="bg-[#0D1916] rounded-2xl p-5 border border-[rgba(100,255,190,0.12)] cursor-pointer hover:bg-[#101F1B] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-[#32E89A]">
                        {format(parseISO(entry.date), 'EEE').toUpperCase()}
                      </span>
                      <span className="text-2xl font-bold text-[#F5F7F6]">
                        {format(parseISO(entry.date), 'd')}
                      </span>
                    </div>
                    <div className="w-px h-12 bg-[rgba(100,255,190,0.12)]" />
                  </div>
                  <span className="text-[#68746F]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </div>
                
                <h3 className="text-base font-semibold text-[#F5F7F6] mb-2">
                  {entry.title || 'Untitled Entry'}
                </h3>
                <p className="text-sm text-[#AAB5B1] line-clamp-2 mb-3">
                  {entry.content || 'No content...'}
                </p>
                
                <div className="flex items-center gap-2">
                  <span className="text-lg">{entry.mood || '🙂'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <RiseNavbar />
    </div>
  )
}
