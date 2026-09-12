import type { Metadata } from 'next'
import StatsClient from './StatsClient'

export const metadata: Metadata = {
  title: 'Stats — arise by victarc',
  description: 'Track your journaling progress and insights',
}

export default function StatsPage() {
  return <StatsClient />
}
