import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.victarc.in'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/leaderboard', '/login', '/privacy', '/terms', '/refund'],
      disallow: ['/dashboard', '/admin', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
