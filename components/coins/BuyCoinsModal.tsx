'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Loader2, X, Copy, Upload, AlertTriangle, 
  CheckCircle, RefreshCw, HelpCircle, Coins 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import { QRCodeCanvas } from 'qrcode.react'
import { UPI_CONFIG, COIN_UPI_CONFIG } from '@/lib/upiConfig'

interface BuyCoinsModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newCoins: number) => void
}

type Step = 'packages' | 'pay' | 'upload' | 'verifying' | 'manual_pending' | 'rejected' | 'success'

interface Package {
  id: string
  coins: number
  amount: number
  label: string
  note: string
  tag?: string
}

export default function BuyCoinsModal({ user, isOpen, onClose, onSuccess }: BuyCoinsModalProps) {
  const [flowStep, setFlowStep] = useState<Step>('packages')
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  
  // Form input states
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  
  // Verification states
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [createdRequestId, setCreatedRequestId] = useState('')
  const [copiedTooltip, setCopiedTooltip] = useState(false)
  
  // Polling state
  const [pollingStatusText, setPollingStatusText] = useState('')
  const [isPolling, setIsPolling] = useState(false)

  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Clean previews
  useEffect(() => {
    return () => {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview)
      }
    }
  }, [screenshotPreview])

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_CONFIG.upiId)
    setCopiedTooltip(true)
    setTimeout(() => setCopiedTooltip(false), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      selectFile(files[0])
    }
  }

  const selectFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit!')
      return
    }
    setScreenshotFile(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  // Submit and verify
  const handleSubmitVerification = async () => {
    if (!selectedPackage || !screenshotFile || !utrNumber) return

    setFlowStep('verifying')
    setCurrentStepIndex(0)
    setVerificationError(null)

    try {
      const fileId = typeof window !== 'undefined' && window.crypto?.randomUUID 
        ? window.crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15)
      
      const fileExt = screenshotFile.name.split('.').pop() || 'jpg'
      const filePath = `${user.id}/${fileId}.${fileExt}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, screenshotFile)

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      setCurrentStepIndex(1)
      await new Promise(r => setTimeout(r, 1200))

      // Insert row in database
      const { data: reqData, error: dbError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.username,
          plan: 'coins',
          amount: selectedPackage.amount,
          upi_transaction_id: utrNumber,
          screenshot_url: filePath,
          status: 'pending',
          verified_by: 'pending',
          coins_amount: selectedPackage.coins
        })
        .select()
        .single()

      if (dbError) throw new Error(`Database error: ${dbError.message}`)
      setCreatedRequestId(reqData.id)

      setCurrentStepIndex(2)
      await new Promise(r => setTimeout(r, 1000))

      setCurrentStepIndex(3)

      // Call AI verification
      const verifyRes = await fetch('/api/verify-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqData.id,
          screenshotUrl: filePath,
          expectedAmount: selectedPackage.amount,
          upiId: UPI_CONFIG.upiId,
          userName: user.username
        })
      })

      setCurrentStepIndex(4)
      await new Promise(r => setTimeout(r, 800))

      const verifyResult = await verifyRes.json()

      if (!verifyRes.ok) {
        throw new Error(verifyResult.error || 'AI verification failed')
      }

      if (verifyResult.approved) {
        // AI approved! Refresh session
        const { data: profile } = await supabase
          .from('users')
          .select('coins')
          .eq('id', user.id)
          .single()
        
        if (onSuccess && profile) {
          onSuccess(profile.coins)
        }
        await supabase.auth.refreshSession()
        setFlowStep('success')
      } else if (verifyResult.manualReview) {
        setFlowStep('manual_pending')
      } else if (verifyResult.rejected) {
        setVerificationError(verifyResult.reason || 'Screenshot details did not match.')
        setFlowStep('rejected')
      } else {
        setFlowStep('manual_pending')
      }

    } catch (err: unknown) {
      console.error(err)
      setVerificationError(err instanceof Error ? err.message : 'An error occurred during submission.')
      setFlowStep('rejected')
    }
  }

  // Poll database status check
  const checkRequestStatus = async () => {
    if (!createdRequestId) return
    setIsPolling(true)
    setPollingStatusText('Checking server...')

    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('status, admin_note')
        .eq('id', createdRequestId)
        .single()

      if (error) throw error

      if (data.status === 'approved') {
        setPollingStatusText('Approved! Updating balance...')
        const { data: profile } = await supabase
          .from('users')
          .select('coins')
          .eq('id', user.id)
          .single()
        
        if (onSuccess && profile) {
          onSuccess(profile.coins)
        }
        await supabase.auth.refreshSession()
        setIsPolling(false)
        setFlowStep('success')
      } else if (data.status === 'rejected') {
        setVerificationError(data.admin_note || 'Rejected by Administrator.')
        setIsPolling(false)
        setFlowStep('rejected')
      } else {
        setPollingStatusText('Still pending review...')
        setTimeout(() => setPollingStatusText(''), 2500)
        setIsPolling(false)
      }
    } catch (err) {
      console.error(err)
      setPollingStatusText('Failed to check status.')
      setIsPolling(false)
    }
  }

  const getPackageGradient = (pkgId: string) => {
    switch (pkgId) {
      case 'coins_100':
        return 'from-zinc-800 to-zinc-900 border-zinc-700'
      case 'coins_500':
        return 'from-purple-950/40 to-purple-900/40 border-purple-500/40 shadow-[0_0_15px_rgba(124,58,237,0.1)]'
      case 'coins_1000':
        return 'from-blue-950/30 to-blue-900/30 border-blue-500/30'
      case 'coins_10000':
        return 'from-yellow-950/20 to-yellow-900/20 border-yellow-500/40 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
      case 'coins_20000':
        return 'from-red-950/30 to-purple-900/20 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.2)] animate-pulse'
      default:
        return 'from-zinc-900 to-zinc-950 border-zinc-800'
    }
  }

  const getPackageBadgeColor = (tag: string) => {
    if (tag === 'POPULAR') return 'bg-purple-600 border-purple-400 text-white'
    if (tag === 'BEST VALUE') return 'bg-yellow-500 border-yellow-400 text-black'
    return 'bg-red-600 border-red-400 text-white'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-4xl bg-neutral-950 border border-purple-500/40 rounded-2xl shadow-[0_0_50px_rgba(124,58,237,0.3)] p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full bg-white/5 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 0: PACKAGES GRID */}
        {flowStep === 'packages' && (
          <div className="space-y-6">
            <div className="text-center md:text-left border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-2xl font-exo2 font-black uppercase text-white tracking-widest flex items-center justify-center md:justify-start gap-2">
                  <Coins className="w-6 h-6 text-yellow-500" /> BUY VICTARC COINS
                </h1>
                <p className="text-xs font-rajdhani text-neutral-400 mt-1 uppercase tracking-wider">
                  Unlock premium badges, custom borders, and legendary aura cosmetics
                </p>
              </div>
              
              {/* Balance */}
              <div className="px-4 py-2 bg-purple-950/20 border border-purple-500/30 rounded-lg text-sm font-exo2 font-black text-purple-400 tracking-wider">
                ⚡ CURRENT BALANCE: {(user.coins || 0).toLocaleString()} COINS
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {COIN_UPI_CONFIG.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-6 rounded-xl border flex flex-col justify-between gap-6 relative overflow-hidden group ${getPackageGradient(pkg.id)}`}
                >
                  {pkg.tag && (
                    <span className={`absolute -top-1.5 right-4 px-2 py-0.5 rounded border font-exo2 font-black text-[9px] uppercase tracking-wider ${getPackageBadgeColor(pkg.tag)}`}>
                      {pkg.tag}
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Coins className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-exo2 font-black text-lg text-white">
                        {pkg.coins.toLocaleString()} COINS
                      </span>
                    </div>
                    <p className="font-rajdhani text-xs text-neutral-400 leading-normal">{pkg.label}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="font-mono text-xl font-bold text-white">₹{pkg.amount}</span>
                    <button
                      onClick={() => {
                        setSelectedPackage(pkg)
                        setFlowStep('pay')
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-purple-600 border border-white/10 hover:border-purple-500 text-white rounded-lg font-exo2 font-black text-[10px] uppercase tracking-widest transition-all duration-200"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: QR CODE SCREEN */}
        {flowStep === 'pay' && selectedPackage && (
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-center gap-6 max-w-xl mx-auto w-full text-center"
          >
            <h2 className="text-xl font-exo2 font-black uppercase text-purple-400 tracking-wider">
              COMPLETE YOUR PAYMENT
            </h2>

            {/* Compact summary */}
            <div className="w-full p-4 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center text-left">
              <div>
                <h4 className="font-exo2 font-black text-sm uppercase text-white">
                  {selectedPackage.coins.toLocaleString()} VICTARC COINS
                </h4>
                <p className="font-rajdhani text-xs text-neutral-400 mt-0.5">Will be credited to your account instantly</p>
              </div>
              <span className="font-mono text-xl font-bold text-yellow-500">₹{selectedPackage.amount}</span>
            </div>

            {/* QR Canvas */}
            <div className="p-4 bg-white rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-purple-500/30 flex items-center justify-center">
              <QRCodeCanvas 
                value={COIN_UPI_CONFIG.upiDeeplink(UPI_CONFIG.upiId, selectedPackage.amount, selectedPackage.note)} 
                size={200}
                level="M"
              />
            </div>

            <div className="space-y-1">
              <p className="font-rajdhani text-xs font-bold text-neutral-400 uppercase tracking-widest">
                Scan with any UPI app
              </p>
              
              {/* UPI ID */}
              <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md cursor-pointer group mt-2" onClick={handleCopyUpi}>
                <code className="font-mono text-sm text-purple-400 font-semibold">{UPI_CONFIG.upiId}</code>
                <Copy className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                
                {copiedTooltip && (
                  <span className="absolute bg-purple-600 text-white text-[10px] font-rajdhani font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider left-1/2 -translate-x-1/2 -top-6">
                    Copied! ✓
                  </span>
                )}
              </div>
            </div>

            {/* UPI Deeplinks */}
            <div className="flex flex-wrap justify-center gap-3 w-full mt-2">
              {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                <a
                  key={app}
                  href={COIN_UPI_CONFIG.upiDeeplink(UPI_CONFIG.upiId, selectedPackage.amount, selectedPackage.note)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-purple-500/30 hover:border-purple-500 bg-purple-950/10 hover:bg-purple-950/30 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider text-neutral-200 transition-colors"
                >
                  📱 {app}
                </a>
              ))}
            </div>

            <div className="text-4xl font-exo2 font-black text-yellow-500 tracking-wider">
              ₹{selectedPackage.amount}
            </div>

            {/* Notice box */}
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-950/10 text-left flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <p className="font-rajdhani text-xs text-neutral-300 leading-relaxed">
                ⚠️ After paying, come back here and upload your payment screenshot below. Coins will be credited within 2 hours.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 w-full pt-4 border-t border-white/5">
              <button
                onClick={() => setFlowStep('packages')}
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-lg font-exo2 font-black text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setFlowStep('upload')}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-colors"
              >
                I&apos;ve Paid, Upload Proof
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: PROOF UPLOAD SCREEN */}
        {flowStep === 'upload' && selectedPackage && (
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col gap-6 max-w-xl mx-auto w-full text-left"
          >
            <h2 className="text-xl font-exo2 font-black uppercase text-purple-400 tracking-wider text-center">
              UPLOAD PAYMENT PROOF
            </h2>

            {/* UTR Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-rajdhani font-bold text-neutral-400 uppercase tracking-widest">
                Enter UPI Transaction ID / UTR Number
              </label>
              <input
                type="text"
                required
                maxLength={12}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="12-digit number from your UPI app"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 font-rajdhani text-sm text-white placeholder:text-neutral-600 tracking-widest"
              />
            </div>

            {/* Drag Drop screenshot */}
            <div className="space-y-1.5">
              <label className="text-xs font-rajdhani font-bold text-neutral-400 uppercase tracking-widest">
                Upload Payment Screenshot
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-purple-500/20 hover:border-purple-500/50 rounded-xl bg-purple-950/5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors relative overflow-hidden min-h-[160px]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {screenshotPreview ? (
                  <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={screenshotPreview} 
                      alt="Screenshot preview" 
                      className="max-h-full max-w-full object-contain rounded border border-purple-500/40" 
                    />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setScreenshotFile(null)
                        setScreenshotPreview(null)
                      }}
                      className="absolute top-2 right-2 bg-black/80 hover:bg-black text-red-500 text-xs px-2.5 py-1 rounded border border-red-500/20 font-rajdhani font-bold uppercase tracking-wider"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-purple-400 stroke-[1.5]" />
                    <div className="text-center">
                      <p className="font-rajdhani text-sm font-bold text-neutral-200">Drag & drop or click to upload screenshot</p>
                      <p className="font-rajdhani text-[11px] text-neutral-500 mt-1">Max size: 5MB (JPG, PNG, WEBP)</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full pt-4 border-t border-white/5">
              <button
                onClick={() => setFlowStep('pay')}
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-lg font-exo2 font-black text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                disabled={!screenshotFile || utrNumber.length < 12}
                onClick={handleSubmitVerification}
                className={`flex-1 py-3 rounded-lg font-exo2 font-black text-xs uppercase tracking-widest border transition-all duration-200 ${
                  screenshotFile && utrNumber.length === 12
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(124,58,237,0.4)]'
                    : 'bg-neutral-900 border-white/5 text-neutral-600 cursor-not-allowed'
                }`}
              >
                Submit For Verification
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: AUTOMATED VERIFY LOADER (AI SCANNING EFFECT) */}
        {flowStep === 'verifying' && (
          <div className="flex flex-col items-center justify-center p-8 gap-8 max-w-md mx-auto w-full">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
              <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-b from-purple-500/0 via-purple-500/30 to-purple-500/0 h-1/2 top-1/4 animate-pulse rounded-md" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-exo2 font-black text-base uppercase text-white tracking-widest">
                Analyzing Payment
              </h3>
              <p className="font-rajdhani text-xs text-neutral-400 animate-pulse">
                🔍 Verifying your payment automatically...
              </p>
            </div>

            <div className="w-full space-y-3 bg-white/[0.02] border border-white/5 p-5 rounded-xl text-left">
              {[
                "Screenshot received",
                "Analyzing payment details...",
                "Checking transaction ID...",
                "Verifying amount...",
                "Finalizing verification..."
              ].map((stepText, idx) => {
                const isCompleted = currentStepIndex > idx
                const isCurrent = currentStepIndex === idx

                return (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-3 font-rajdhani text-xs font-bold transition-all duration-300 ${
                      isCompleted ? 'text-emerald-400' : isCurrent ? 'text-purple-400' : 'text-neutral-600'
                    }`}
                  >
                    {isCompleted ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </motion.div>
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[9px] font-bold">
                        {idx + 1}
                      </div>
                    )}
                    <span>{stepText}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 4: MANUAL REVIEW LAYOUT (PENDING VIEW) */}
        {flowStep === 'manual_pending' && selectedPackage && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center text-center p-8 gap-6 max-w-md mx-auto w-full"
          >
            <div className="w-16 h-16 rounded-full border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              <HelpCircle className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-exo2 font-black text-lg uppercase text-yellow-500 tracking-widest">
                Manual Review Required
              </h3>
              <p className="font-rajdhani text-sm text-neutral-300 leading-relaxed">
                Our system needs to review your proof manually. Coins are typically credited within 2 hours.
              </p>
            </div>

            <div className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-lg font-mono text-left space-y-1.5 text-xs text-neutral-400">
              <p>Request ID: <span className="text-white">{createdRequestId.slice(0, 8)}...</span></p>
              <p>Package: <span className="text-white">{selectedPackage.coins.toLocaleString()} Coins</span></p>
              <p>UTR No: <span className="text-white">{utrNumber}</span></p>
              <p>Status: <span className="text-yellow-500 font-bold uppercase">Pending Manual Review</span></p>
            </div>

            {pollingStatusText && (
              <p className="font-rajdhani text-xs text-purple-400 font-bold animate-pulse">
                {pollingStatusText}
              </p>
            )}

            <div className="flex flex-col gap-3 w-full mt-4">
              <button
                disabled={isPolling}
                onClick={checkRequestStatus}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2"
              >
                {isPolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Check Status
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-400 hover:text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest transition-colors"
              >
                Go back to Vault
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: AI REJECTED LAYOUT */}
        {flowStep === 'rejected' && selectedPackage && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center text-center p-8 gap-6 max-w-md mx-auto w-full"
          >
            <div className="w-16 h-16 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <X className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-exo2 font-black text-lg uppercase text-red-500 tracking-widest">
                Verification Failed
              </h3>
              <p className="font-rajdhani text-sm text-red-400 font-bold bg-red-950/20 border border-red-900/30 p-3 rounded-lg leading-relaxed w-full">
                Reason: {verificationError || 'Screenshot did not match expected criteria.'}
              </p>
            </div>

            <div className="w-full text-left bg-white/[0.01] border border-white/5 p-5 rounded-xl space-y-2">
              <h4 className="font-rajdhani text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Please make sure:
              </h4>
              <ul className="space-y-1.5 font-rajdhani text-xs text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Payment is completed successfully
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Amount matches package price exactly: ₹{selectedPackage.amount}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Full 12-digit transaction ID (UTR number) is visible
                </li>
              </ul>
            </div>

            <div className="flex gap-4 w-full mt-4">
              <a
                href={`mailto:${UPI_CONFIG.adminEmail}?subject=Payment Verification Help — Request ID ${createdRequestId}`}
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center"
              >
                Contact Support
              </a>
              <button
                onClick={() => {
                  setScreenshotFile(null)
                  setScreenshotPreview(null)
                  setUtrNumber('')
                  setFlowStep('upload')
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 6: VERIFICATION SUCCESS SCREEN */}
        {flowStep === 'success' && selectedPackage && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center text-center p-8 gap-6 max-w-md mx-auto w-full"
          >
            <div className="w-16 h-16 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-exo2 font-black text-lg uppercase text-emerald-400 tracking-widest">
                COINS CREDITED!
              </h3>
              <p className="font-rajdhani text-sm text-neutral-300 leading-relaxed">
                AI verified your payment instantly. <strong>{selectedPackage.coins.toLocaleString()} Coins</strong> have been added to your Hunter Balance.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-colors mt-4"
            >
              Enter the Shadow Vault
            </button>
          </motion.div>
        )}

      </motion.div>
    </div>
  )
}
