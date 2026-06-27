'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import type { User, Challenge, Rank, Category, PaymentRequest } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import AdminActions from '@/app/admin/AdminActions'
import RankBadge from '@/components/RankBadge'
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/constants'

interface CompletionWithDetails {
  id: string
  user_id: string
  challenge_id: string
  proof_text: string | null
  proof_image_url: string | null
  status: 'pending' | 'approved' | 'rejected'
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

type Tab = 'challenges' | 'users' | 'completions' | 'payments' | 'admin_actions'

export default function AdminClient({
  initialUsers,
  initialChallenges,
  initialCompletions,
  currentUser,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('challenges')
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges)
  const [completions, setCompletions] = useState<CompletionWithDetails[]>(initialCompletions)
  const [searchQuery, setSearchQuery] = useState('')

  // Payment requests state
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)
  
  // Note dialogs
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null)
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null)
  const [adminNoteInput, setAdminNoteInput] = useState('')
  const [rejectReasonInput, setRejectReasonInput] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)

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

  // Load and subscribe to payment requests
  const fetchPaymentRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .order('submitted_at', { ascending: false })
    if (!error && data) {
      setPaymentRequests(data)
    }
  }, [supabase])

  useEffect(() => {
    fetchPaymentRequests()
  }, [fetchPaymentRequests])

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_requests' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setPaymentRequests((prev) => [payload.new as PaymentRequest, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setPaymentRequests((prev) =>
              prev.map((r) => (r.id === payload.new.id ? (payload.new as PaymentRequest) : r))
            )
          } else if (payload.eventType === 'DELETE') {
            setPaymentRequests((prev) => prev.filter((r) => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Approve payment request handler
  const handleApprovePayment = async () => {
    if (!approvingRequestId) return
    setIsActionLoading(true)
    try {
      const { error: approveError } = await supabase.rpc('approve_payment', {
        p_request_id: approvingRequestId,
        p_admin_note: adminNoteInput || 'Manually approved by Administrator'
      })

      if (approveError) throw approveError

      // Also update verified_by to manual
      await supabase
        .from('payment_requests')
        .update({ verified_by: 'manual' })
        .eq('id', approvingRequestId)

      // Log action in admin_actions table
      await supabase.from('admin_actions').insert({
        action: 'approve',
        request_id: approvingRequestId,
        performed_via: 'dashboard'
      })

      // Get request details to send email confirmation
      const req = paymentRequests.find(r => r.id === approvingRequestId)
      if (req) {
        // trigger email notification asynchronously
        fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'approved',
            userName: req.user_name,
            userEmail: req.user_email,
            plan: req.plan,
            amount: req.amount,
            txnId: req.upi_transaction_id || 'UPI_MANUAL',
          })
        }).catch(err => console.error('Failed to notify client of approval:', err))
      }

      setApprovingRequestId(null)
      setAdminNoteInput('')
      fetchPaymentRequests()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to approve payment')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Reject payment request handler
  const handleRejectPayment = async () => {
    if (!rejectingRequestId || !rejectReasonInput) return
    setIsActionLoading(true)
    try {
      const { error: rejectError } = await supabase.rpc('reject_payment', {
        p_request_id: rejectingRequestId,
        p_admin_note: rejectReasonInput
      })

      if (rejectError) throw rejectError

      // Update verified_by to manual
      await supabase
        .from('payment_requests')
        .update({ verified_by: 'manual' })
        .eq('id', rejectingRequestId)

      // Log action in admin_actions table
      await supabase.from('admin_actions').insert({
        action: 'reject',
        request_id: rejectingRequestId,
        performed_via: 'dashboard'
      })

      const req = paymentRequests.find(r => r.id === rejectingRequestId)
      if (req) {
        fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rejected',
            userName: req.user_name,
            userEmail: req.user_email,
            plan: req.plan,
            amount: req.amount,
            reason: rejectReasonInput
          })
        }).catch(err => console.error('Failed to notify client of rejection:', err))
      }

      setRejectingRequestId(null)
      setRejectReasonInput('')
      fetchPaymentRequests()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to reject payment')
    } finally {
      setIsActionLoading(false)
    }
  }

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

  // Recalculate user stats on approval and update state locally
  function updateUserStatsLocally(userId: string, xpEarned: number) {
    setUsers(prevUsers =>
      prevUsers.map(u => {
        if (u.id !== userId) return u
        const newXp = u.xp + xpEarned
        const newLevel = Math.floor(newXp / 100) + 1
        let newRank: Rank = 'E'
        if (newXp >= 50000) newRank = 'SSS'
        else if (newXp >= 20000) newRank = 'SS'
        else if (newXp >= 10000) newRank = 'S'
        else if (newXp >= 5000) newRank = 'A'
        else if (newXp >= 2500) newRank = 'B'
        else if (newXp >= 1200) newRank = 'C'
        else if (newXp >= 500) newRank = 'D'
        
        return {
          ...u,
          xp: newXp,
          level: newLevel,
          rank: newRank,
        }
      })
    )
  }

  // Approve completion
  async function handleApproveCompletion(id: string) {
    const comp = completions.find(c => c.id === id)
    if (!comp) return

    try {
      const { error: updateError } = await supabase
        .from('completions')
        .update({ status: 'approved' })
        .eq('id', id)

      if (updateError) throw updateError

      setCompletions(prev =>
        prev.map(c => (c.id === id ? { ...c, status: 'approved' as const } : c))
      )
      
      updateUserStatsLocally(comp.user_id, comp.xp_earned)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to approve completion')
    }
  }

  // Reject completion (delete completion so the user can re-submit)
  async function handleRejectCompletion(id: string) {
    if (!confirm('Are you sure you want to reject this completion? The completion will be deleted, allowing the user to attempt it again.')) return

    try {
      const { error: deleteError } = await supabase
        .from('completions')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setCompletions(prev => prev.filter(c => c.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to reject completion')
    }
  }


  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

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
            {(['challenges', 'users', 'completions', 'payments', 'admin_actions'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-exo2 font-black text-xs uppercase tracking-widest relative transition-colors ${
                activeTab === tab ? 'text-white' : 'text-muted-foreground hover:text-white'
              }`}
            >
              {tab === 'challenges' 
                ? '🛡️ Quest Manager' 
                : tab === 'users' 
                ? '🎴 Hunter Roster' 
                : tab === 'completions' 
                ? '📜 System Logs' 
                : tab === 'admin_actions' 
                ? '⚙️ Admin Actions' 
                : '🪙 Payment Requests'}
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
                      className="p-5 rounded-lg border space-y-3 relative overflow-hidden"
                      style={{
                        background: 'rgba(255,255,255,0.01)',
                        borderColor: comp.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                        boxShadow: comp.status === 'pending' ? '0 0 15px rgba(245,158,11,0.05)' : 'none',
                      }}
                    >
                      {/* Top border glow for pending item */}
                      {comp.status === 'pending' && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-500 to-amber-500/20" />
                      )}

                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-exo2 font-black text-sm uppercase text-purple-400">
                            👤 {comp.user?.username || 'Unknown Hunter'}
                          </p>
                          <p className="text-xs text-white font-bold mt-1 uppercase font-exo2">
                            Quest: {comp.challenge?.title || 'Unknown Quest'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[10px] font-rajdhani text-muted-foreground">
                            {new Date(comp.completed_at).toLocaleString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-exo2 font-black uppercase tracking-wider ${
                              comp.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : comp.status === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                            }`}
                          >
                            {comp.status === 'approved'
                              ? '✓ Approved'
                              : comp.status === 'rejected'
                              ? '✗ Rejected'
                              : '⌛ Pending'}
                          </span>
                        </div>
                      </div>

                      {comp.proof_text && (
                        <p className="text-xs text-muted-foreground bg-white/[0.02] border border-white/5 p-3 rounded font-rajdhani leading-relaxed italic">
                          &ldquo;{comp.proof_text}&rdquo;
                        </p>
                      )}

                      {comp.proof_image_url && (
                        <div className="relative w-48 h-32 mt-2 rounded border border-white/10 overflow-hidden group">
                          <a href={comp.proof_image_url} target="_blank" rel="noopener noreferrer">
                            <Image
                              src={comp.proof_image_url}
                              alt="Proof image"
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                              <span className="text-[10px] font-exo2 font-black uppercase text-white tracking-wider">
                                🔍 View Image
                              </span>
                            </div>
                          </a>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs font-rajdhani">
                        {comp.status === 'approved' ? (
                          <span className="text-emerald-400 font-bold">
                            ✓ XP Awarded: +{comp.xp_earned} XP
                          </span>
                        ) : comp.status === 'rejected' ? (
                          <span className="text-red-400 font-bold">
                            ✗ Rejected
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold animate-pulse">
                            ⌛ XP Pending: +{comp.xp_earned} XP
                          </span>
                        )}
                      </div>

                      {comp.status === 'pending' && (
                        <div className="flex gap-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleApproveCompletion(comp.id)}
                            className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/40 rounded font-exo2 font-black text-[10px] uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          >
                            🟢 Approve
                          </button>
                          <button
                            onClick={() => handleRejectCompletion(comp.id)}
                            className="px-4 py-1.5 bg-red-600/10 border border-red-500/40 rounded font-exo2 font-black text-[10px] uppercase tracking-wider text-red-400 hover:bg-red-600/20 transition-all"
                          >
                            🔴 Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* Payment Requests Manager Tab */}
            {activeTab === 'payments' && (
              <motion.div
                key="payments-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="p-5 rounded-lg border flex flex-col justify-center bg-white/[0.01] border-white/5 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                    <p className="text-[10px] font-rajdhani text-muted-foreground uppercase tracking-widest">Pending Manual Review</p>
                    <p className="text-3xl font-exo2 font-black text-yellow-500 mt-1">
                      {paymentRequests.filter((r: PaymentRequest) => r.status === 'pending_manual').length}
                    </p>
                  </div>
                  <div className="p-5 rounded-lg border flex flex-col justify-center bg-white/[0.01] border-white/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                    <p className="text-[10px] font-rajdhani text-muted-foreground uppercase tracking-widest">Auto-Approved Today 🤖</p>
                    <p className="text-3xl font-exo2 font-black text-emerald-400 mt-1">
                      {paymentRequests.filter((r: PaymentRequest) => r.status === 'approved' && r.verified_by === 'ai' && r.reviewed_at && new Date(r.reviewed_at).toDateString() === new Date().toDateString()).length}
                    </p>
                  </div>
                  <div className="p-5 rounded-lg border flex flex-col justify-center bg-white/[0.01] border-white/5 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                    <p className="text-[10px] font-rajdhani text-muted-foreground uppercase tracking-widest">Auto-Rejected Today 🤖</p>
                    <p className="text-3xl font-exo2 font-black text-red-400 mt-1">
                      {paymentRequests.filter((r: PaymentRequest) => r.status === 'rejected' && r.verified_by === 'ai' && r.reviewed_at && new Date(r.reviewed_at).toDateString() === new Date().toDateString()).length}
                    </p>
                  </div>
                  <div className="p-5 rounded-lg border flex flex-col justify-center bg-white/[0.01] border-white/5 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
                    <p className="text-[10px] font-rajdhani text-muted-foreground uppercase tracking-widest">Total Revenue Estimate</p>
                    <p className="text-3xl font-exo2 font-black text-purple-400 mt-1">
                      ₹{paymentRequests.filter((r: PaymentRequest) => r.status === 'approved').reduce((acc: number, curr: PaymentRequest) => acc + curr.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Filter Selector */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All Requests' },
                    { key: 'pending', label: 'Pending Review' },
                    { key: 'approved', label: 'Approved' },
                    { key: 'rejected', label: 'Rejected' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setPaymentFilter(filter.key as 'all' | 'pending' | 'approved' | 'rejected')}
                      className={`px-4 py-1.5 rounded-full text-xs font-rajdhani font-semibold uppercase tracking-wider transition-all duration-200 border ${
                        paymentFilter === filter.key
                          ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_10px_rgba(124,58,237,0.2)]'
                          : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Requests Table */}
                <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.01]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs font-rajdhani text-muted-foreground uppercase tracking-widest">
                        <th className="p-4">Time</th>
                        <th className="p-4">Hunter</th>
                        <th className="p-4">Plan / Package</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">UPI TXN ID</th>
                        <th className="p-4">Screenshot</th>
                        <th className="p-4">Verified By</th>
                        <th className="p-4">AI Score</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm font-rajdhani text-white">
                      {paymentRequests
                        .filter((r) => {
                          if (paymentFilter === 'all') return true
                          if (paymentFilter === 'pending') return r.status === 'pending' || r.status === 'pending_manual'
                          return r.status === paymentFilter
                        })
                        .map((r) => {
                          const isManualPending = r.status === 'pending_manual'
                          const isPending = r.status === 'pending'
                          const isApproved = r.status === 'approved'
                          const isRejected = r.status === 'rejected'

                          return (
                            <tr 
                              key={r.id} 
                              className={`hover:bg-white/[0.02] transition-colors ${
                                isManualPending ? 'bg-yellow-500/5' : ''
                              }`}
                            >
                              <td className="p-4 text-xs text-muted-foreground">
                                {new Date(r.submitted_at).toLocaleString()}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-white uppercase">{r.user_name}</div>
                                <div className="text-xs text-muted-foreground">{r.user_email}</div>
                              </td>
                              <td className="p-4 uppercase font-bold text-xs text-purple-400">
                                {r.plan === 'coins' ? `🪙 ${r.coins_amount?.toLocaleString()} Coins` : `${r.plan}-Rank Plan`}
                              </td>
                              <td className="p-4 font-mono font-bold text-yellow-500">₹{r.amount}</td>
                              <td className="p-4 font-mono text-xs">{r.upi_transaction_id || 'N/A'}</td>
                              <td className="p-4">
                                <ScreenshotThumbnail path={r.screenshot_url} onClick={setSelectedScreenshot} />
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-exo2 font-black uppercase border ${
                                    r.verified_by === 'ai'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : r.verified_by === 'ai_flagged'
                                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                      : r.verified_by === 'manual'
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                  }`}
                                >
                                  {r.verified_by === 'ai'
                                    ? '🤖 AI'
                                    : r.verified_by === 'ai_flagged'
                                    ? '🤖 FLAGGED'
                                    : r.verified_by === 'manual'
                                    ? '👤 MANUAL'
                                    : 'PENDING'}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-xs">
                                {r.ai_confidence !== null ? (
                                  <span
                                    style={{
                                      color: r.ai_confidence >= 90 
                                        ? '#10b981' 
                                        : r.ai_confidence >= 70 
                                        ? '#f59e0b' 
                                        : '#ef4444'
                                    }}
                                  >
                                    {r.ai_confidence}%
                                  </span>
                                ) : (
                                  <span className="text-neutral-600">—</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-exo2 font-black uppercase border ${
                                    isApproved
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : isRejected
                                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {(isPending || isManualPending) ? (
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setApprovingRequestId(r.id)}
                                      className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded font-exo2 font-black text-[9px] uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => setRejectingRequestId(r.id)}
                                      className="px-2.5 py-1 bg-red-600/10 border border-red-500/40 rounded font-exo2 font-black text-[9px] uppercase tracking-wider text-red-400 hover:bg-red-600/20"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-neutral-500 italic block pr-2">
                                    Audited {r.admin_note ? `(${r.admin_note.slice(0, 20)}...)` : ''}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      {paymentRequests.length === 0 && (
                        <tr>
                          <td colSpan={10} className="text-center text-muted-foreground py-8">
                            No requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin_actions' && (
              <AdminActions />
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

      {/* Screenshot Lightbox Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedScreenshot(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-lg border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedScreenshot} alt="Proof zoom" className="max-w-full max-h-[80vh] object-contain rounded" />
              <button 
                onClick={() => setSelectedScreenshot(null)} 
                className="absolute top-3 right-3 text-neutral-400 hover:text-white p-1 rounded-full bg-black/60 border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Approve Note Modal */}
      <AnimatePresence>
        {approvingRequestId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md p-6 bg-neutral-950 border border-purple-500/40 rounded-xl text-white space-y-4 shadow-xl"
            >
              <h3 className="text-base font-exo2 font-black uppercase text-white">Approve Payment</h3>
              <p className="text-xs text-neutral-400 font-rajdhani">Add a review note to log with this transaction (optional):</p>
              <input
                type="text"
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="e.g. Verified on banking panel"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded font-rajdhani text-sm focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => {
                    setApprovingRequestId(null)
                    setAdminNoteInput('')
                  }}
                  className="flex-1 py-2 bg-neutral-900 border border-white/10 text-neutral-400 rounded font-exo2 font-black text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleApprovePayment}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-exo2 font-black text-xs uppercase flex items-center justify-center gap-1.5"
                >
                  {isActionLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Reject Note Modal */}
      <AnimatePresence>
        {rejectingRequestId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md p-6 bg-neutral-950 border border-red-500/40 rounded-xl text-white space-y-4 shadow-xl"
            >
              <h3 className="text-base font-exo2 font-black uppercase text-red-400">Reject Payment</h3>
              <p className="text-xs text-neutral-400 font-rajdhani">Please state the rejection reason (required):</p>
              <input
                type="text"
                required
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="e.g. UTR number incorrect or not found"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded font-rajdhani text-sm focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => {
                    setRejectingRequestId(null)
                    setRejectReasonInput('')
                  }}
                  className="flex-1 py-2 bg-neutral-900 border border-white/10 text-neutral-400 rounded font-exo2 font-black text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isActionLoading || !rejectReasonInput}
                  onClick={handleRejectPayment}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded font-exo2 font-black text-xs uppercase flex items-center justify-center gap-1.5"
                >
                  {isActionLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ScreenshotThumbnail({ path, onClick }: { path: string; onClick: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUrl = async () => {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(path, 300)
      if (!error && data) {
        setUrl(data.signedUrl)
      }
    }
    getUrl()
  }, [path, supabase])

  if (!url) {
    return <div className="w-12 h-12 bg-white/5 animate-pulse rounded border border-white/10" />
  }

  return (
    <div className="relative w-12 h-12 rounded border border-white/10 overflow-hidden cursor-pointer hover:border-purple-500 transition-colors" onClick={() => onClick(url)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Proof thumbnail" className="w-full h-full object-cover" />
    </div>
  )
}
