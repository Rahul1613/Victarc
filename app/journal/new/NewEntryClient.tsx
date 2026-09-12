'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useJournal } from '@/context/JournalContext'
import { toDateKey } from '@/lib/utils'

function stripEntryBody(content: string): string {
  const marker = '\n\n---\nChecklist:'
  const idx = content.indexOf(marker)
  return idx === -1 ? content : content.slice(0, idx).trimEnd()
}

export default function NewEntryClient() {
  const router = useRouter()
  const {
    upsertEntry,
    getEntry,
    tasks,
    addTask,
    toggleTask,
    updateTask,
    ensureDefaultTasks,
    refreshTasks,
  } = useJournal()

  const today = toDateKey(new Date())
  const existingEntry = getEntry(today)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [draftTask, setDraftTask] = useState('')
  const [showDraft, setShowDraft] = useState(false)
  const [quote] = useState('Progress, not perfection.')
  const [mood, setMood] = useState('🙂')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tasksReady, setTasksReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadTasks() {
      const { error: seedError } = await ensureDefaultTasks()
      if (seedError && !seedError.includes('Not signed in')) {
        await refreshTasks()
      }
      if (!cancelled) setTasksReady(true)
    }

    loadTasks()
    return () => { cancelled = true }
  }, [ensureDefaultTasks, refreshTasks])

  useEffect(() => {
    if (!existingEntry) return
    setTitle(existingEntry.title === 'Untitled Entry' ? '' : existingEntry.title)
    setContent(stripEntryBody(existingEntry.content))

    const moodMatch = existingEntry.content.match(/Mood:\s*([^\n\r]+)/)
    if (moodMatch) setMood(moodMatch[1].trim())
  }, [existingEntry])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    let tasksForSave = tasks

    if (showDraft && draftTask.trim()) {
      const { error: draftError, data: newTask } = await addTask(draftTask.trim())
      if (draftError) {
        setError(draftError)
        setSaving(false)
        return
      }
      if (newTask) tasksForSave = [...tasksForSave, newTask]
      setDraftTask('')
      setShowDraft(false)
    }

    const checklistText = tasksForSave
      .filter(item => item.text.trim())
      .map(item => `${item.completed ? '✅' : '⬜'} ${item.text}`)
      .join('\n')

    const fullContent =
      content +
      (checklistText ? `\n\n---\nChecklist:\n${checklistText}` : '') +
      `\n\nMood: ${mood}`

    const { error: saveError } = await upsertEntry(today, title || 'Untitled Entry', fullContent)

    setSaving(false)

    if (saveError) {
      setError(saveError)
      return
    }

    router.push('/journal')
  }

  const handleToggleTask = async (id: string) => {
    const { error: toggleError } = await toggleTask(id)
    if (toggleError) setError(toggleError)
  }

  const handleUpdateTask = async (id: string, text: string) => {
    const { error: updateError } = await updateTask(id, text)
    if (updateError) setError(updateError)
  }

  const handleAddItem = () => {
    setShowDraft(true)
    setDraftTask('')
  }

  const commitDraftTask = async () => {
    if (!draftTask.trim()) {
      setShowDraft(false)
      return
    }

    const { error: addError } = await addTask(draftTask.trim())
    if (addError) {
      setError(addError)
      return
    }

    setDraftTask('')
    setShowDraft(false)
  }

  const handleDraftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitDraftTask()
    }
    if (e.key === 'Escape') {
      setDraftTask('')
      setShowDraft(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020B08]">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button onClick={() => router.back()} className="text-[#AAB5B1]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" />
            </svg>
          </button>
          <h1 className="text-lg md:text-2xl font-bold text-[#F5F7F6]">New Entry</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-[#32E89A] font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Date */}
        <div className="mb-4 md:mb-6">
          <p className="text-sm md:text-base text-[#68746F]">
            {format(new Date(), 'EEE, d MMM yyyy')}
          </p>
        </div>

        {/* Title */}
        <div className="mb-4 md:mb-6">
          <input
            type="text"
            placeholder="Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-2xl md:text-3xl font-bold text-[#F5F7F6] placeholder-[#68746F] border-none outline-none"
          />
        </div>

        {/* Editor */}
        <div className="mb-6 md:mb-8">
          <textarea
            placeholder="Today was an amazing day! I feel more focused and motivated..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 md:h-80 bg-transparent text-[#F5F7F6] placeholder-[#68746F] border-none outline-none resize-none leading-relaxed text-sm md:text-base"
          />
        </div>

        {/* Checklist */}
        <div className="mb-6 md:mb-8">
          <h3 className="text-sm md:text-base font-bold text-[#F5F7F6] mb-3">Checklist</h3>
          <div className="space-y-2">
            {!tasksReady && (
              <p className="text-sm text-[#68746F]">Loading tasks...</p>
            )}
            {tasks.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleTask(item.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    item.completed
                      ? 'bg-[#32E89A] border-[#32E89A] text-[#020B08]'
                      : 'border-[rgba(100,255,190,0.3)]'
                  }`}
                >
                  {item.completed && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
                <input
                  type="text"
                  defaultValue={item.text}
                  key={`${item.id}-${item.text}`}
                  onBlur={(e) => {
                    const next = e.target.value.trim()
                    if (next && next !== item.text) {
                      handleUpdateTask(item.id, next)
                    }
                  }}
                  className="flex-1 bg-transparent text-[#F5F7F6] placeholder-[#68746F] border-none outline-none text-sm md:text-base"
                  placeholder="Add item..."
                />
              </div>
            ))}
            {showDraft && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[rgba(100,255,190,0.3)] shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={draftTask}
                  onChange={(e) => setDraftTask(e.target.value)}
                  onBlur={commitDraftTask}
                  onKeyDown={handleDraftKeyDown}
                  className="flex-1 bg-transparent text-[#F5F7F6] placeholder-[#68746F] border-none outline-none text-sm md:text-base"
                  placeholder="Add item..."
                />
              </div>
            )}
            <button
              type="button"
              onClick={handleAddItem}
              className="text-sm md:text-base text-[#32E89A] font-semibold"
            >
              + Add item
            </button>
          </div>
        </div>

        {/* Quote */}
        <div className="mb-6 md:mb-8">
          <div className="bg-[#0D1916] rounded-2xl p-4 md:p-6 border border-[rgba(100,255,190,0.12)]">
            <p className="text-sm md:text-base text-[#AAB5B1] italic">&ldquo;{quote}&rdquo;</p>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="mb-6 md:mb-8">
          <h3 className="text-sm md:text-base font-bold text-[#F5F7F6] mb-3">How are you feeling?</h3>
          <div className="flex gap-3 md:gap-4">
            {['😊', '🙂', '😐', '😔', '😢'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setMood(emoji)}
                className={`text-2xl md:text-3xl p-2 md:p-3 rounded-xl transition-all ${
                  mood === emoji
                    ? 'bg-[#32E89A]/20 border-2 border-[#32E89A]'
                    : 'bg-[#0D1916] border-2 border-transparent'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="pb-24 md:pb-0">
          <div className="flex items-center justify-between bg-[#0D1916] rounded-2xl p-4 border border-[rgba(100,255,190,0.12)]">
            <div className="flex gap-4">
              <button type="button" className="text-[#AAB5B1] hover:text-[#32E89A] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                </svg>
              </button>
              <button type="button" className="text-[#AAB5B1] hover:text-[#32E89A] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                </svg>
              </button>
              <button type="button" className="text-[#AAB5B1] hover:text-[#32E89A] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                </svg>
              </button>
            </div>
            <div className="flex gap-4">
              <button type="button" className="text-[#AAB5B1] hover:text-[#32E89A] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </button>
              <button type="button" className="text-[#AAB5B1] hover:text-[#32E89A] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
