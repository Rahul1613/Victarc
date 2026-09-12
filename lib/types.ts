// ============================================================
// RISE JOURNAL — Core Types
// ============================================================

export type ThemeMode = 'dark' | 'light' | 'system'

export interface JournalEntry {
  id: string
  user_id: string
  date: string // 'YYYY-MM-DD'
  title: string
  content: string // HTML string
  mood?: string | null
  images: string[]
  links: string[]
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  bio: string
  avatar_url: string | null
  created_at: string
}

export interface AppSettings {
  theme: ThemeMode
  daily_reminder_enabled: boolean
  daily_reminder_time: string // 'HH:MM' e.g. '09:00'
}

export interface JournalStats {
  totalEntries: number
  currentStreak: number
  longestStreak: number
  thisMonth: number
  thisWeek: number
  today: number
}

export interface AdminAction {
  id: string
  action: string
  request_id: string | null
  performed_via: string
  performed_at: string
  details: Record<string, unknown> | null
}

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS'
export type Category = 'fitness' | 'mindset' | 'discipline' | 'nutrition' | 'social'

export interface User {
  id: string
  email: string
  username: string
  full_name?: string | null
  avatar_url?: string | null
  rank: Rank
  xp: number
  level: number
  coins?: number
  plan?: 'demo' | 'arank' | 'srank' | string
  instagram_handle?: string | null
  is_admin?: boolean
  streak?: number
  last_active?: string | null
  created_at?: string
  unlocked_items?: string[]
  unlocked_badges?: string[]
}

export interface Challenge {
  id: string
  title: string
  description: string
  category: Category
  difficulty: Rank
  xp_reward: number
  duration_days: number
  is_boss_challenge?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Completion {
  id: string
  user_id: string
  challenge_id: string
  proof_text?: string | null
  proof_image_url?: string | null
  status: 'pending' | 'approved' | 'rejected'
  completed_at: string
  xp_earned: number
  user?: { username: string }
  challenge?: { title: string }
}

export interface PaymentRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  plan: string
  amount: number
  coins_amount?: number | null
  status: 'pending' | 'approved' | 'rejected' | 'pending_manual'
  submitted_at: string
  reviewed_at?: string | null
  screenshot_url?: string | null
  upi_transaction_id?: string | null
  verified_by?: 'ai' | 'ai_flagged' | 'manual' | 'pending' | string | null
  ai_confidence?: number | null
  admin_note?: string | null
}

export interface CommittedQuest {
  id: string
  user_id: string
  challenge_id: string
  committed_at: string
  expires_at?: string
  penalty_amount?: number
  status?: string
}

export interface PenaltyQuest {
  id: string
  user_id: string
  challenge_id: string
  challenge_text?: string
  xp_loss?: number
  penalty_amount?: number
  status: string
  created_at: string
  deadline?: string
}

export interface LeaderboardEntry {
  id: string
  username: string
  rank: Rank
  level: number
  xp: number
  streak: number
  instagram_handle?: string | null
  avatar_url?: string | null
  total_completions?: number
  position?: number
}

export interface XPProgress {
  currentXP: number
  currentThreshold: number
  nextThreshold: number
  percentage: number
  currentRank: Rank
  nextRank: Rank | null
}

export interface RankUpInfo {
  rankUp: boolean
  oldRank: Rank
  newRank: Rank
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
