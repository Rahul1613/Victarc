'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoIntroOverlayProps {
  src: string
  onComplete: () => void
}

export default function VideoIntroOverlay({
  src,
  onComplete,
}: VideoIntroOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [fading, setFading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [needsClickToPlay, setNeedsClickToPlay] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Attempt autoplay
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true)
        })
        .catch((error) => {
          console.log('Autoplay blocked by browser policy:', error)
          // If autoplay with sound is blocked, attempt to play it muted
          video.muted = true
          setIsMuted(true)
          const secondPlayPromise = video.play()
          if (secondPlayPromise !== undefined) {
            secondPlayPromise
              .then(() => {
                setIsPlaying(true)
              })
              .catch((err) => {
                console.log('Autoplay failed completely:', err)
                setNeedsClickToPlay(true)
              })
          } else {
            setNeedsClickToPlay(true)
          }
        })
    }
  }, [src])

  const handleStart = () => {
    const video = videoRef.current
    if (video) {
      video.muted = false
      setIsMuted(false)
      video.play().then(() => {
        setIsPlaying(true)
        setNeedsClickToPlay(false)
      })
    }
  }

  const handleSkip = () => {
    setFading(true)
    setTimeout(() => {
      onComplete()
    }, 500) // 0.5s transition
  }

  const handleVideoEnded = () => {
    setFading(true)
    setTimeout(() => {
      onComplete()
    }, 500) // 0.5s transition
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ease-in-out"
      style={{
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Absolute fullscreen video */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        playsInline
        autoPlay
        onEnded={handleVideoEnded}
      />

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-10 px-4 py-2 bg-black/40 hover:bg-black/80 border border-white/20 hover:border-white/50 text-white font-rajdhani font-semibold uppercase tracking-widest text-xs rounded transition-all duration-300"
      >
        Skip Intro ⚡
      </button>

      {/* Unmute/Mute Toggle Indicator */}
      {isPlaying && isMuted && (
        <button
          onClick={() => {
            const video = videoRef.current
            if (video) {
              video.muted = false
              setIsMuted(false)
            }
          }}
          className="absolute bottom-6 left-6 z-10 flex items-center gap-2 px-4 py-2.5 bg-[#7c3aed]/80 hover:bg-[#7c3aed] border border-[#a78bfa]/50 text-white font-rajdhani font-bold uppercase tracking-wider text-xs rounded-full transition-all duration-300 animate-pulse shadow-lg"
        >
          🔊 Click to Unmute
        </button>
      )}

      {/* Manual Click to Play Overlay (if blocked completely by browser) */}
      {needsClickToPlay && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95">
          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-lg font-exo2 font-black text-sm uppercase tracking-widest transition-all duration-300 text-white cursor-pointer hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              boxShadow: '0 0 35px rgba(124,58,237,0.7)',
            }}
          >
            ⚡ Awaken System (Click to Play)
          </button>
        </div>
      )}
    </div>
  )
}
