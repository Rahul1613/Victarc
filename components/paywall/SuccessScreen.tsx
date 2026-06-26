'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Download, Loader2, Sparkles } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import type { User } from '@/lib/types'

interface SuccessScreenProps {
  user: User
  plan: 'basic' | 'premium'
  paymentId: string
  paidAt: string
}

export default function SuccessScreen({ user, plan, paymentId, paidAt }: SuccessScreenProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingPng, setDownloadingPng] = useState(false)
  const [autoDownloaded, setAutoDownloaded] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const formattedDate = new Date(paidAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) // Format: dd/mm/yyyy

  const planName = plan === 'premium' ? 'S-RANK HUNTER ⭐' : 'A-RANK HUNTER'
  const planPriceStr = plan === 'premium' ? '₹99' : '₹49'
  const paymentIdShort = paymentId.slice(0, 8)

  // Download PDF Receipt
  const handleDownloadReceipt = useCallback(() => {
    setDownloadingPdf(true)
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5' // A5 size is standard and perfect for receipts
      })

      // Draw dark background
      doc.setFillColor(5, 5, 11) // #05050b
      doc.rect(0, 0, 148, 210, 'F')

      // Draw purple border glow outline
      doc.setDrawColor(108, 99, 255) // #6c63ff
      doc.setLineWidth(1)
      doc.rect(6, 6, 136, 198)

      // Header title
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('Helvetica', 'bold')
      doc.text('VICTARC', 74, 25, { align: 'center' })

      // Divider line
      doc.setDrawColor(60, 60, 90)
      doc.setLineWidth(0.5)
      doc.line(15, 32, 133, 32)

      // Receipt details header
      doc.setTextColor(167, 139, 250) // #a78bfa
      doc.setFontSize(11)
      doc.text('OFFICIAL PAYMENT RECEIPT', 74, 42, { align: 'center' })

      // Main receipt fields
      doc.setTextColor(226, 232, 240) // light gray text
      doc.setFontSize(10)
      doc.setFont('Helvetica', 'normal')

      let yPos = 64
      const spacing = 12

      doc.text(`Hunter Name:`, 20, yPos)
      doc.setFont('Helvetica', 'bold')
      doc.text(`${user.username || 'Hunter'}`, 55, yPos)
      
      doc.setFont('Helvetica', 'normal')
      yPos += spacing
      doc.text(`Email Address:`, 20, yPos)
      doc.text(`${user.email}`, 55, yPos)

      yPos += spacing
      doc.text(`Plan Purchased:`, 20, yPos)
      doc.setFont('Helvetica', 'bold')
      doc.text(`${planName}`, 55, yPos)

      doc.setFont('Helvetica', 'normal')
      yPos += spacing
      doc.text(`Amount Paid:`, 20, yPos)
      doc.text(`${planPriceStr} INR`, 55, yPos)

      yPos += spacing
      doc.text(`Payment ID:`, 20, yPos)
      doc.text(`${paymentId}`, 55, yPos)

      yPos += spacing
      doc.text(`Date & Time (IST):`, 20, yPos)
      doc.text(`${new Date(paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 55, yPos)

      // Divider line
      doc.line(15, 140, 133, 140)

      // Access status confirmation
      doc.setTextColor(34, 211, 238) // Cyan color
      doc.setFontSize(14)
      doc.setFont('Helvetica', 'bold')
      doc.text('LIFETIME ACCESS GRANTED ✓', 74, 155, { align: 'center' })

      // Footer
      doc.setTextColor(100, 116, 139) // Slate gray text
      doc.setFontSize(8)
      doc.setFont('Helvetica', 'normal')
      doc.text('victarc.in — Computer generated receipt. No signature required.', 74, 192, { align: 'center' })

      doc.save(`Victarc_Receipt_${paymentIdShort}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
    } finally {
      setDownloadingPdf(false)
    }
  }, [paymentIdShort, user.username, user.email, planName, planPriceStr, paymentId, paidAt])

  // Download Hunter Card PNG
  const handleDownloadCard = useCallback(async () => {
    if (!cardRef.current) return
    setDownloadingPng(true)
    try {
      // Small delay to ensure styles and ref rendering are complete
      await new Promise((resolve) => setTimeout(resolve, 300))

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Retain sharp texts
        useCORS: true
      })

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `Victarc_Hunter_Card.png`
      link.click()
    } catch (err) {
      console.error('Error capturing PNG card:', err)
    } finally {
      setDownloadingPng(false)
    }
  }, [])

  // Auto trigger downloads on mount
  useEffect(() => {
    if (autoDownloaded) return

    const triggerAutoDownloads = async () => {
      // Brief delay to allow intro animations to load
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      handleDownloadReceipt()
      await handleDownloadCard()
      setAutoDownloaded(true)
    }

    triggerAutoDownloads()
  }, [autoDownloaded, handleDownloadCard, handleDownloadReceipt])

  // Handle Redirect Home
  const handleGoDashboard = () => {
    window.location.href = '/dashboard' // Force refresh page to reload middleware session
  }

  return (
    <div className="fixed inset-0 z-[250] bg-black flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      
      {/* Background staggered burst circles (Framer Motion) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 5, opacity: 0 }}
            transition={{
              duration: 2.5,
              delay: i * 0.4,
              ease: 'easeOut',
              repeat: Infinity
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border border-purple-500/30"
          />
        ))}
      </div>

      {/* Main Success Content Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 1.2 }}
        className="z-10 max-w-xl space-y-6"
      >
        {/* Glow badge header */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-yellow-400 bg-yellow-950/20 text-yellow-400 shadow-[0_0_40px_rgba(251,191,36,0.5)] mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-yellow-400/50 scale-110"
          />
          <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
        </div>

        <h1 className="text-4xl font-exo2 font-black uppercase tracking-widest text-white leading-tight">
          YOU HAVE ARISEN, <span className="text-purple-400">HUNTER</span>.
        </h1>
        <p className="text-lg font-rajdhani font-black text-purple-300 uppercase tracking-widest animate-pulse">
          WELCOME TO THE SHADOW ARMY
        </p>

        {/* Action Button Panel */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          {/* PDF button */}
          <button
            onClick={handleDownloadReceipt}
            disabled={downloadingPdf}
            className="px-6 py-3.5 bg-neutral-900 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-white rounded-lg font-rajdhani font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200"
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Receipt (PDF)
          </button>

          {/* PNG button */}
          <button
            onClick={handleDownloadCard}
            disabled={downloadingPng}
            className="px-6 py-3.5 bg-neutral-900 border border-cyan-500/30 hover:border-cyan-500 text-cyan-300 hover:text-white rounded-lg font-rajdhani font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200"
          >
            {downloadingPng ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Hunter Card (PNG)
          </button>
        </div>

        {/* Redirect button */}
        <div className="pt-4">
          <button
            onClick={handleGoDashboard}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 hover:scale-105 border border-purple-400 text-white rounded-xl font-exo2 font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-300"
          >
            ENTER THE SHADOW REALM →
          </button>
        </div>
      </motion.div>

      {/* ============================================================
         OFFSCREEN CARD RENDER CONTAINER (FOR HTML2CANVAS CAPTURE)
         ============================================================ */}
      <div 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px',
          overflow: 'hidden'
        }}
      >
        <div
          ref={cardRef}
          id="hunter-card"
          style={{
            width: '400px',
            height: '240px',
            background: 'linear-gradient(135deg, #070714 0%, #15102a 60%, #030308 100%)',
            border: '2px solid #7c3aed',
            borderRadius: '16px',
            boxShadow: '0 0 35px rgba(124, 58, 237, 0.45)',
            padding: '16px 20px',
            color: '#ffffff',
            fontFamily: "'Exo 2', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          {/* Top header strip */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: '6px'
            }}
          >
            <span 
              style={{ 
                fontSize: '8px', 
                fontWeight: 900, 
                letterSpacing: '3px', 
                color: '#8b5cf6',
                textTransform: 'uppercase'
              }}
            >
              VICTARC HUNTERS GUILD — OFFICIAL MEMBER
            </span>
            <span style={{ fontSize: '10px' }}>⚔️</span>
          </div>

          {/* Card Body */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span 
                style={{ 
                  fontSize: '24px', 
                  fontWeight: 900, 
                  letterSpacing: '1px', 
                  color: '#ffffff',
                  textShadow: '0 0 10px rgba(255,255,255,0.1)'
                }}
              >
                SHADOW ARMY
              </span>
              <span 
                style={{ 
                  fontSize: '13px', 
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700, 
                  color: '#94a3b8' 
                }}
              >
                HUNTER: <strong style={{ color: '#ffffff' }}>{user.username || 'Hunter'}</strong>
              </span>
            </div>

            {/* Rank badge display */}
            <div style={{ textAlign: 'right' }}>
              <div 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: 950, 
                  color: plan === 'premium' ? '#fbbf24' : '#c084fc',
                  textTransform: 'uppercase',
                  border: `1.5px solid ${plan === 'premium' ? '#fbbf24' : '#7c3aed'}`,
                  background: 'rgba(0,0,0,0.4)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  boxShadow: `0 0 15px ${plan === 'premium' ? 'rgba(251,191,36,0.3)' : 'rgba(124,58,237,0.2)'}`
                }}
              >
                {plan === 'premium' ? 'S-RANK ⭐' : 'A-RANK'}
              </div>
            </div>
          </div>

          {/* Card Footer strip */}
          <div 
            style={{ 
              borderTop: '1px solid rgba(255,255,255,0.06)', 
              paddingTop: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '9px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              color: '#4b5563'
            }}
          >
            <span>ID: {paymentIdShort} · LIFETIME ACCESS</span>
            <span style={{ color: '#8b5cf6', fontWeight: 700 }}>ARISE · {formattedDate}</span>
          </div>

        </div>
      </div>

    </div>
  )
}
