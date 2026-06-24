import type { Rank, Category } from './types'

export const RANK_COLORS: Record<string, { text: string; border: string; glow: string; bg: string }> = {
  E: { text: '#94a3b8', border: '#334155', glow: 'rgba(148,163,184,0.2)', bg: 'rgba(148,163,184,0.05)' },
  D: { text: '#86efac', border: '#166534', glow: 'rgba(134,239,172,0.2)', bg: 'rgba(134,239,172,0.05)' },
  C: { text: '#67e8f9', border: '#164e63', glow: 'rgba(103,232,249,0.2)', bg: 'rgba(103,232,249,0.05)' },
  B: { text: '#818cf8', border: '#312e81', glow: 'rgba(129,140,248,0.2)', bg: 'rgba(129,140,248,0.05)' },
  A: { text: '#f472b6', border: '#831843', glow: 'rgba(244,114,182,0.2)', bg: 'rgba(244,114,182,0.05)' },
  S: { text: '#fbbf24', border: '#92400e', glow: 'rgba(251,191,36,0.4)', bg: 'rgba(251,191,36,0.08)' },
  SS: { text: '#fb923c', border: '#7c2d12', glow: 'rgba(251,146,60,0.5)', bg: 'rgba(251,146,60,0.08)' },
  SSS: { text: '#c084fc', border: '#6b21a8', glow: 'rgba(192,132,252,0.6)', bg: 'rgba(192,132,252,0.1)' },
}

export const XP_THRESHOLDS: Record<string, number> = {
  E: 0,
  D: 500,
  C: 1500,
  B: 4000,
  A: 10000,
  S: 25000,
  SS: 60000,
  SSS: 150000,
}

export const RANKS: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']

export const CATEGORY_ICONS: Record<Category, string> = {
  fitness: '⚡',
  mindset: '🧠',
  discipline: '🔥',
  nutrition: '💧',
  social: '👥',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  fitness: '#f472b6',
  mindset: '#818cf8',
  discipline: '#fbbf24',
  nutrition: '#67e8f9',
  social: '#86efac',
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  E: 'Rank E',
  D: 'Rank D',
  C: 'Rank C',
  B: 'Rank B',
  A: 'Rank A',
  S: 'Rank S',
}
