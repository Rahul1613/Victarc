import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.victarc.in'

  const routes = ['', '/leaderboard', '/login', '/privacy', '/terms', '/refund'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date().toISOString(),
      changeFrequency: (route === '' || route === '/leaderboard' ? 'daily' : 'weekly') as 'daily' | 'weekly',
      priority: route === '' ? 1.0 : route === '/leaderboard' ? 0.8 : 0.5,
    })
  )

  return routes
}
