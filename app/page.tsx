import type { Metadata } from 'next'
import LandingClient from './LandingClient'

export const metadata: Metadata = {
  title: 'Rise Journal — Daily Reflection & Growth',
  description:
    'Your personal growth journal. Write freely, reflect deeply, build streaks, and become a better you every day.',
  alternates: {
    canonical: '/',
  },
}

export default function LandingPage() {
  return <LandingClient />
}
