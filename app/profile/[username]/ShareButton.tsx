'use client'

import { useState } from 'react'

interface ShareButtonProps {
  username: string
}

export default function ShareButton({ username }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/profile/${username}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s VICTARC Profile`,
          text: `Check out ${username}'s fitness challenge stats on VICTARC!`,
          url,
        })
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      id="share-profile-btn"
      className="px-6 py-2 rounded-lg font-exo2 font-bold text-xs uppercase tracking-widest transition-all duration-200"
      style={{
        border: '1px solid rgba(124,58,237,0.4)',
        color: '#a78bfa',
        background: 'rgba(124,58,237,0.05)',
      }}
    >
      {copied ? '✓ Link Copied!' : '🔗 Share Profile'}
    </button>
  )
}
