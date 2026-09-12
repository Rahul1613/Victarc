import type { Metadata } from 'next'
import ProfileClient from './ProfileClient'

export const metadata: Metadata = {
  title: 'Profile — arise by victarc',
  description: 'Manage your profile and settings',
}

export default function ProfilePage() {
  return <ProfileClient />
}
