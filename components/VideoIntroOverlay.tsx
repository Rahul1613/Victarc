'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoIntroOverlayProps {
  src: string
  onComplete: () => void
  defaultMuted?: boolean
  shrinkOnMobile?: boolean
}

export default function VideoIntroOverlay({
  src,
  onComplete,
  defaultMuted = false,
  shrinkOnMobile = false,
}: VideoIntroOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [fading, setFading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [needsClickToPlay, setNeedsClickToPlay] = useState(false)
  const [isMuted, setIsMuted] = useState(defaultMuted)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Apply default muted state
    video.muted = defaultMuted

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
  }, [src, defaultMuted])

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

  const videoClass = shrinkOnMobile
    ? "w-full h-[82dvh] md:h-full object-cover"
    : "w-full h-full object-cover"

  return (
    <div
      className="fixed top-0 left-0 w-[100dvw] h-[100dvh] z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ease-in-out"
      style={{
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Absolute fullscreen video - object-cover with h-[88dvh] on mobile if shrinkOnMobile is true to reduce zoom/crop */}
      <video
        ref={videoRef}
        src={src}
        className={videoClass}
        playsInline
        autoPlay
        muted={isMuted}
        onEnded={handleVideoEnded}
      />

      {/* Skip Button - scaled for mobile */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 px-3 py-1.5 md:px-4 md:py-2 bg-black/40 hover:bg-black/80 border border-white/20 hover:border-white/50 text-white font-rajdhani font-semibold uppercase tracking-widest text-[10px] md:text-xs rounded transition-all duration-300"
      >
        Skip Intro ⚡
      </button>

      {/* Unmute/Mute Toggle Indicator - scaled for mobile */}
      {isPlaying && isMuted && (
        <button
          onClick={() => {
            const video = videoRef.current
            if (video) {
              video.muted = false
              setIsMuted(false)
            }
          }}
          className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 bg-[#7c3aed]/80 hover:bg-[#7c3aed] border border-[#a78bfa]/50 text-white font-rajdhani font-bold uppercase tracking-wider text-[10px] md:text-xs rounded-full transition-all duration-300 animate-pulse shadow-lg"
        >
          🔊 Click to Unmute
        </button>
      )}

      {/* Manual Click to Play Overlay (if blocked completely by browser) - scaled for mobile */}
      {needsClickToPlay && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 px-4 text-center">
          <button
            onClick={handleStart}
            className="px-6 py-3.5 md:px-8 md:py-4 rounded-lg font-exo2 font-black text-xs md:text-sm uppercase tracking-widest transition-all duration-300 text-white cursor-pointer hover:scale-105"
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
