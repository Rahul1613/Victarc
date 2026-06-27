import type { Metadata } from 'next'
import LandingClient from './LandingClient'

export const metadata: Metadata = {
  title: 'VICTARC — Solo Leveling Fitness & Gamified Daily Quests',
  description:
    'Arise and become the Shadow Monarch. Victarc is a gamified Solo Leveling fitness platform featuring daily quests, penalty alerts, real-time leaderboard, and rank upgrades.',
  alternates: {
    canonical: '/',
  },
}

export default function LandingPage() {
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'VICTARC',
    'operatingSystem': 'All',
    'applicationCategory': 'HealthApplication, ExerciseApplication',
    'offers': {
      '@type': 'Offer',
      'price': '49.00',
      'priceCurrency': 'INR',
    },
    'description':
      'Arise and become the Shadow Monarch. Victarc is a gamified Solo Leveling fitness platform featuring daily quests, penalty alerts, real-time leaderboard, and rank upgrades.',
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'ratingCount': '312',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'VICTARC',
    'url': 'https://www.victarc.in',
    'description':
      'Daily fitness and self-growth challenges based on the Solo Leveling rank progression system. Earn XP and level up from E to SSS Rank.',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://www.victarc.in/leaderboard?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <LandingClient />
    </>
  )
}
