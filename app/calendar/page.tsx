import type { Metadata } from 'next'
import CalendarClient from './CalendarClient'

export const metadata: Metadata = {
  title: 'Calendar — arise by victarc',
  description: 'View your journal entries by date',
}

export default function CalendarPage() {
  return <CalendarClient />
}
