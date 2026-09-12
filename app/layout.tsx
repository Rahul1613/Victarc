import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { JournalProvider } from '@/context/JournalContext'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.victarc.in'),
  title: {
    default: 'arise by victarc — Daily Reflection & Growth',
    template: '%s | arise by victarc',
  },
  description:
    'Your personal growth journal. Write freely, reflect deeply, build streaks, and become a better you every day.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <SettingsProvider>
            <JournalProvider>
              {children}
            </JournalProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
