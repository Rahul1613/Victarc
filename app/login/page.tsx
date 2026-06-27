import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Join the Hunt — Sign In or Register',
  description:
    'Sign in or register for a free VICTARC account. Access daily fitness quests, level up your rank from E to SSS, view active streaks, and track your workout coins.',
  alternates: {
    canonical: '/login',
  },
}

export default function LoginPage() {
  return <LoginClient />
}
