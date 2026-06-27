export interface User {
  id: string
  username: string
  email: string
  rank: Rank
  xp: number
  level: number
  streak: number
  last_active: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  coins: number
  unlocked_items: string[]
  unlocked_badges: string[]
  plan?: 'demo' | 'basic' | 'premium'
  payment_id?: string | null
  paid_at?: string | null
  instagram_handle?: string | null
}

export interface Challenge {
  id: string
  title: string
  description: string
  category: Category
  difficulty: Rank
  xp_reward: number
  duration_days: number
  is_boss_challenge: boolean
  is_active: boolean
  created_at: string
}

export interface Completion {
  id: string
  user_id: string
  challenge_id: string
  proof_text: string | null
  completed_at: string
  xp_earned: number
  challenge?: Challenge
}

export interface LeaderboardEntry {
  id: string
  username: string
  rank: Rank
  xp: number
  level: number
  streak: number
  avatar_url: string | null
  total_completions: number
  position: number
  instagram_handle?: string | null
}

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS'

export type Category = 'fitness' | 'mindset' | 'discipline' | 'nutrition' | 'social'

export interface RankUpInfo {
  rankUp: boolean
  oldRank: Rank
  newRank: Rank
}

export interface XPProgress {
  currentXP: number
  currentThreshold: number
  nextThreshold: number
  percentage: number
  currentRank: Rank
  nextRank: Rank | null
}

export interface CommittedQuest {
  id: string
  user_id: string
  challenge_id: string
  committed_at: string
  expires_at: string
  status: 'active' | 'completed' | 'failed'
  challenges?: Challenge
}

export interface PenaltyQuest {
  id: string
  user_id: string
  issued_at: string
  deadline: string
  challenge_text: string
  xp_loss: number
  status: 'active' | 'completed' | 'failed'
}

export interface PaymentRequest {
  id: string
  user_id: string
  user_email: string
  user_name: string
  plan: 'basic' | 'premium' | 'coins'
  amount: number
  upi_transaction_id: string | null
  screenshot_url: string
  status: 'pending' | 'pending_manual' | 'approved' | 'rejected'
  admin_note: string | null
  submitted_at: string
  reviewed_at: string | null
  verified_by: 'pending' | 'ai' | 'ai_flagged' | 'manual'
  ai_confidence: number | null
  ai_reason: string | null
  ai_extracted_txn_id: string | null
  screenshot_hash: string | null
  is_flagged_fraud: boolean
  fraud_reason: string | null
  coins_amount: number | null
}

export interface AdminAction {
  id: string
  action: 'approve' | 'reject'
  request_id: string | null
  performed_via: 'email_link' | 'dashboard'
  performed_at: string
  details?: Record<string, unknown> | null
}
