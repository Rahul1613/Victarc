import type { Metadata } from 'next'
import LandingClient from './LandingClient'

export const metadata: Metadata = {
  title: 'VICTARC — Arise. Complete. Dominate.',
  description:
    'Daily fitness and self-growth challenges. Earn XP, rank up from E to SSS, and compete on the global leaderboard.',
}

export default function LandingPage() {
  return <LandingClient />
}
