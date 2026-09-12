import type { Metadata } from 'next'
import HomeClient from './HomeClient'

export const metadata: Metadata = {
  title: 'Home — arise by victarc',
  description: 'Your daily growth dashboard',
}

export default function HomePage() {
  return <HomeClient />
}
