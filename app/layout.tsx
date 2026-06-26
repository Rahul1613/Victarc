import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'VICTARC — Arise. Complete. Dominate.',
    template: '%s | VICTARC',
  },
  description:
    'Daily fitness and self-growth challenges. Earn XP, rank up from E to SSS, and compete on the global leaderboard. Become the Shadow Monarch.',
  keywords: ['fitness', 'challenges', 'self-improvement', 'XP', 'leaderboard', 'solo levelling'],
  openGraph: {
    title: 'VICTARC — Arise. Complete. Dominate.',
    description: 'Daily fitness and self-growth challenges. Rank up. Become the Shadow Monarch.',
    type: 'website',
    url: 'https://www.victarc.in',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VICTARC',
    description: 'Daily fitness challenges. Rank up. Become the Shadow Monarch.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {children}
      </body>
    </html>
  )
}
