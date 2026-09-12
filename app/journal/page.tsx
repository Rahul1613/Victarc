import type { Metadata } from 'next'
import JournalClient from './JournalClient'

export const metadata: Metadata = {
  title: 'My Journal',
  description: 'Write, reflect, and grow every day.',
}

export default function JournalPage() {
  return <JournalClient />
}
