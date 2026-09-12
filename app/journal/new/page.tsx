import type { Metadata } from 'next'
import NewEntryClient from './NewEntryClient'

export const metadata: Metadata = {
  title: 'New Entry — arise by victarc',
  description: 'Write a new journal entry',
}

export default function NewEntryPage() {
  return <NewEntryClient />
}
