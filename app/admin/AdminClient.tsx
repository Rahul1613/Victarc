'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { User, Challenge, Rank, Category } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import RankBadge from '@/components/RankBadge'
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/constants'

interface CompletionWithDetails {
  id: string
  user_id: string
  challenge_id: string
  proof_text: string | null
  completed_at: string
  xp_earned: number
  user?: { username: string }
  challenge?: { title: string }
}

interface AdminClientProps {
  initialUsers: User[]
  initialChallenges: Challenge[]
  initialCompletions: CompletionWithDetails[]
  currentUser: User
}

type Tab = 'challenges' | 'users' | 'completions'

export default function AdminClient({
  initialUsers,
  initialChallenges,
  initialCompletions,
  currentUser,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('challenges')
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges)
  const [completions] = useState<CompletionWithDetails[]>(initialCompletions)
  const [searchQuery, setSearchQuery] = useState('')

  // New challenge form state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('fitness')
  const [newDifficulty, setNewDifficulty] = useState<Rank>('E')
  const [newXp, setNewXp] = useState(100)
  const [newDuration, setNewDuration] = useState(1)
  const [newIsBoss, setNewIsBoss] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Calculate quick stats
  const totalHunters = users.length
  const activeQuests = challenges.filter(c => c.is_active).length
  const totalCompletionsCount = completions.length

  // Add challenge handler
  async function handleAddChallenge(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('challenges')
        .insert({
          title: newTitle,
          description: newDesc,
          category: newCategory,
          difficulty: newDifficulty,
          xp_reward: Number(newXp),
          duration_days: Number(newDuration),
          is_boss_challenge: newIsBoss,
          is_active: true,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setChallenges([data as Challenge, ...challenges])
      setShowAddModal(false)
      // Reset form
      setNewTitle('')
      setNewDesc('')
      setNewCategory('fitness')
      setNewDifficulty('E')
      setNewXp(100)
      setNewDuration(1)
      setNewIsBoss(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  // Toggle challenge active status
  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (updateError) throw updateError

      setChallenges(
        challenges.map(c => (c.id === id ? { ...c, is_active: !currentStatus } : c))
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update challenge status')
    }
  }

  // Delete challenge
  async function handleDeleteChallenge(id: string) {
    if (!confirm('Are you sure you want to delete this challenge? This cannot be undone.')) return

    try {
      const { error: deleteError } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setChallenges(challenges.filter(c => c.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete challenge')
    }
  }

  // Toggle User Admin Status
  async function handleToggleAdmin(id: string, currentAdminStatus: boolean) {
    if (id === currentUser.id) {
      alert('You cannot revoke your own admin rights!')
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: !currentAdminStatus })
        .eq('id', id)

      if (updateError) throw updateError

      setUsers(
        users.map(u => (u.id === id ? { ...u, is_admin: !currentAdminStatus } : u))
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update admin status')
    }
  }

  // Filtered users roster
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--bg-primary)' }}>
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-exo2 font-black uppercase tracking-wider text-white">
              System Control Panel
            </h1>
            <p className="text-muted-foreground font-rajdhani text-sm">
              Level SSS Administrator: {currentUser.username} (SYSTEM ROOT)
            </p>
          </div>
          {activeTab === 'challenges' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded font-exo2 font-black text-xs uppercase tracking-widest text-white transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              }}
            >
              ➕ Create New Quest
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Total Active Hunters', value: totalHunters, icon: '👥', glow: 'rgba(6,182,212,0.15)' },
            { label: 'Active System Quests', value: activeQuests, icon: '⚔️', glow: 'rgba(124,58,237,0.15)' },
            { label: 'Completions Audited', value: totalCompletionsCount, icon: '📜', glow: 'rgba(244,114,182,0.15)' },
          ].map(stat => (
            <div
              key={stat.label}
              className="p-6 rounded-lg border flex items-center justify-between"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.05)',
                boxShadow: `0 0 20px ${stat.glow}`,
              }}
            >
              <div>
                <p className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-exo2 font-black text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 gap-2">
          {(['challenges', 'users', 'completions'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-exo2 font-black text-xs uppercase tracking-widest relative transition-colors ${
                activeTab === tab ? 'text-white' : 'text-muted-foreground hover:text-white'
              }`}
            >
              {tab === 'challenges' ? '🛡️ Quest Manager' : tab === 'users' ? '🎴 Hunter Roster' : '📜 System Logs'}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-purple"
                  style={{ boxShadow: '0 0 10px #7c3aed' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === 'challenges' && (
              <motion.div
                key="challenges-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {challenges.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-12 font-rajdhani">
                    No quests registered in the system database.
                  </p>
                ) : (
                  challenges.map(c => {
                    return (
                      <div
                        key={c.id}
                        className={`p-6 rounded-lg border flex flex-col justify-between transition-all duration-300 relative ${
                          c.is_active ? 'opacity-100' : 'opacity-50'
                        }`}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          borderColor: c.is_active
                            ? c.is_boss_challenge
                              ? '#fbbf24'
                              : 'rgba(255,255,255,0.06)'
                            : 'rgba(255,255,255,0.02)',
                          boxShadow: c.is_active && c.is_boss_challenge
                            ? '0 0 20px rgba(251,191,36,0.1)'
                            : 'none',
                        }}
                      >
                        {/* Boss challenge badge */}
                        {c.is_boss_challenge && c.is_active && (
                          <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-amber-500 rounded text-[9px] font-exo2 font-black uppercase text-black tracking-widest animate-pulse">
                            Boss Quest
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span
                              className="text-xs font-rajdhani font-semibold px-2 py-0.5 rounded uppercase tracking-wider"
                              style={{
                                background: `${CATEGORY_COLORS[c.category]}15`,
                                color: CATEGORY_COLORS[c.category],
                              }}
                            >
                              {CATEGORY_ICONS[c.category]} {c.category}
                            </span>
                            <RankBadge rank={c.difficulty} size="sm" />
                          </div>

                          <div>
                            <h3 className="font-exo2 font-black text-lg text-white uppercase line-clamp-1">
                              {c.title}
                            </h3>
                            <p className="text-xs text-muted-foreground font-rajdhani line-clamp-2 mt-1">
                              {c.description}
                            </p>
                          </div>

                          <div className="flex justify-between items-center text-xs font-rajdhani text-muted-foreground">
                            <div>
                              Reward: <span className="text-white font-bold">{c.xp_reward} XP</span>
                            </div>
                            <div>
                              Duration: <span className="text-white font-bold">{c.duration_days} day(s)</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                          <button
                            onClick={() => handleToggleActive(c.id, c.is_active)}
                            className={`flex-1 py-1.5 rounded font-exo2 font-black text-[10px] uppercase tracking-wider transition-all ${
                              c.is_active
                                ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteChallenge(c.id)}
                            className="px-3 py-1.5 bg-red-600/10 border border-red-500/40 rounded font-exo2 font-black text-[10px] uppercase tracking-wider text-red-400 hover:bg-red-600/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="🔍 Search hunter name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full max-w-md px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 font-rajdhani text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent-purple transition-all"
                />

                <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.01]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs font-rajdhani text-muted-foreground uppercase tracking-widest">
                        <th className="p-4">Rank</th>
                        <th className="p-4">Hunter</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">XP</th>
                        <th className="p-4">Level</th>
                        <th className="p-4">Streak</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm font-rajdhani text-white">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-muted-foreground py-8">
                            No hunters match your search query.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4">
                              <RankBadge rank={u.rank} size="sm" />
                            </td>
                            <td className="p-4 font-bold text-white uppercase tracking-wide">
                              {u.username}
                            </td>
                            <td className="p-4 text-muted-foreground">{u.email}</td>
                            <td className="p-4 font-semibold">{u.xp.toLocaleString()}</td>
                            <td className="p-4">Lvl {u.level}</td>
                            <td className="p-4">🔥 {u.streak}d</td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-exo2 font-black uppercase ${
                                  u.is_admin
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                                }`}
                              >
                                {u.is_admin ? 'Admin' : 'Hunter'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                                className={`px-3 py-1 rounded font-exo2 font-black text-[10px] uppercase tracking-wider transition-colors ${
                                  u.is_admin
                                    ? 'bg-slate-500/10 border border-slate-500/40 text-slate-400 hover:bg-slate-500/20'
                                    : 'bg-purple-600/20 border border-purple-500/40 text-purple-400 hover:bg-purple-600/30'
                                }`}
                              >
                                {u.is_admin ? 'Demote to Hunter' : 'Promote Admin'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'completions' && (
              <motion.div
                key="completions-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 max-w-4xl"
              >
                {completions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 font-rajdhani">
                    No system completion logs found.
                  </p>
                ) : (
                  completions.map((comp, idx) => (
                    <div
                      key={comp.id || idx}
                      className="p-5 rounded-lg border space-y-3"
                      style={{
                        background: 'rgba(255,255,255,0.01)',
                        borderColor: 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-exo2 font-black text-sm uppercase text-purple-400">
                            👤 {comp.user?.username || 'Unknown Hunter'}
                          </p>
                          <p className="text-xs text-white font-bold mt-1 uppercase font-exo2">
                            Quest: {comp.challenge?.title || 'Unknown Quest'}
                          </p>
                        </div>
                        <span className="text-[10px] font-rajdhani text-muted-foreground">
                          {new Date(comp.completed_at).toLocaleString()}
                        </span>
                      </div>

                      {comp.proof_text && (
                        <p className="text-xs text-muted-foreground bg-white/[0.02] border border-white/5 p-3 rounded font-rajdhani leading-relaxed italic">
                          &ldquo;{comp.proof_text}&rdquo;
                        </p>
                      )}

                      <div className="flex justify-between items-center text-xs font-rajdhani">
                        <span className="text-emerald-400 font-bold">
                          ✓ XP Awarded: +{comp.xp_earned} XP
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Challenge Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(4,4,12,0.85)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-lg p-8 rounded-lg border text-white space-y-6"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'rgba(124,58,237,0.3)',
                boxShadow: '0 0 45px rgba(124,58,237,0.15)',
              }}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="text-xl font-exo2 font-black uppercase tracking-wider">
                  Initialize System Quest
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 text-xs rounded font-rajdhani">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddChallenge} className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-rajdhani text-muted-foreground uppercase">Quest Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. 100 Squats"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent-purple text-sm font-rajdhani"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-rajdhani text-muted-foreground uppercase">Description</label>
                  <textarea
                    required
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Detailed quest requirements..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent-purple text-sm font-rajdhani resize-none"
                  />
                </div>

                {/* Category & Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-rajdhani text-muted-foreground uppercase">Category</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as Category)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent-purple text-sm font-rajdhani"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="fitness" className="bg-[#0f0f1c]">Fitness</option>
                      <option value="mindset" className="bg-[#0f0f1c]">Mindset</option>
                      <option value="discipline" className="bg-[#0f0f1c]">Discipline</option>
                      <option value="nutrition" className="bg-[#0f0f1c]">Nutrition</option>
                      <option value="social" className="bg-[#0f0f1c]">Social</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-rajdhani text-muted-foreground uppercase">Required Rank</label>
                    <select
                      value={newDifficulty}
                      onChange={e => setNewDifficulty(e.target.value as Rank)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent-purple text-sm font-rajdhani"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="E" className="bg-[#0f0f1c]">Rank E</option>
                      <option value="D" className="bg-[#0f0f1c]">Rank D</option>
                      <option value="C" className="bg-[#0f0f1c]">Rank C</option>
                      <option value="B" className="bg-[#0f0f1c]">Rank B</option>
                      <option value="A" className="bg-[#0f0f1c]">Rank A</option>
                      <option value="S" className="bg-[#0f0f1c]">Rank S</option>
                    </select>
                  </div>
                </div>

                {/* XP Reward & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-rajdhani text-muted-foreground uppercase">XP Reward</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={100000}
                      value={newXp}
                      onChange={e => setNewXp(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent-purple text-sm font-rajdhani"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-rajdhani text-muted-foreground uppercase">Duration (Days)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={365}
                      value={newDuration}
                      onChange={e => setNewDuration(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-accent-purple text-sm font-rajdhani"
                    />
                  </div>
                </div>

                {/* Boss Challenge Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is-boss-toggle"
                    checked={newIsBoss}
                    onChange={e => setNewIsBoss(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-accent-purple focus:ring-accent-purple"
                  />
                  <label htmlFor="is-boss-toggle" className="text-xs font-rajdhani text-muted-foreground uppercase select-none cursor-pointer">
                    Mark as Boss Quest (Gold highlight)
                  </label>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded font-exo2 font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded font-exo2 font-black text-xs uppercase tracking-widest text-white disabled:opacity-50 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                    }}
                  >
                    {loading ? 'Initializing...' : 'Deploy Quest'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
