import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.victarc.in'),
  title: {
    default: 'VICTARC — Solo Leveling Fitness & Gamified Daily Quests',
    template: '%s | VICTARC',
  },
  description:
    'Arise and become the Shadow Monarch. Victarc is a gamified Solo Leveling fitness platform featuring daily quests, penalty alerts, real-time leaderboard, and rank upgrades.',
  keywords: [
    'Victarc',
    'Solo Leveling Fitness',
    'Solo Leveling Workout',
    'Arise Fitness',
    'Shadow Monarch workout tracker',
    'fitness gamification',
    'daily challenges',
    'RPG fitness app',
    'gamified workout leaderboard',
    'level up fitness',
    'workout tracker',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'VICTARC — Solo Leveling Fitness & Gamified Daily Quests',
    description: 'Arise and become the Shadow Monarch. Daily fitness challenges. Rank up from E to SSS. Compete on the global leaderboard.',
    type: 'website',
    url: 'https://www.victarc.in',
    siteName: 'VICTARC',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VICTARC — Solo Leveling Fitness',
    description: 'Arise and become the Shadow Monarch. Daily fitness challenges and leaderboard.',
  },
  icons: {
    icon: '/favicon.jpg',
    shortcut: '/favicon.jpg',
    apple: '/favicon.jpg',
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
