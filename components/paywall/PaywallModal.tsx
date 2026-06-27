'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ChevronDown, ChevronUp, Loader2, LogIn, Sparkles, X,
  Copy, Upload, AlertTriangle, RefreshCw, HelpCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import SuccessScreen from './SuccessScreen'

import { UPI_CONFIG } from '@/lib/upiConfig'

interface PaywallModalProps {
  user?: User | null
  isOpen: boolean
  onClose: () => void
}

type Language = 'en' | 'hi' | 'mr'

const TRANSLATIONS = {
  en: {
    title: "YOUR TRIAL HAS ENDED.",
    subtitle: "WILL YOU ARISE, HUNTER?",
    loginPrompt: "Please login or register a free profile to purchase lifetime access and save your progress.",
    loginBtn: "⚡ Login to Arise",
    registerBtn: "👑 Register Profile",
    arankBadge: "A-RANK",
    arankTitle: "A-RANK HUNTER",
    arankPrice: "₹49",
    arankBtn: "ARISE FOR ₹49",
    srankBadge: "S-RANK ⭐ RECOMMENDED",
    srankTitle: "S-RANK HUNTER",
    srankPrice: "₹99",
    srankBtn: "ARISE FOR ₹99",
    features: {
      access: "Full website access forever",
      quests: "All daily quests and dungeons",
      xp: "XP system and rank progression",
      leaderboard: "Global leaderboard access",
      onetime: "One-time payment — never pay again",
      early: "Early access to new features before all users",
      rewards: "Exclusive S-Rank rewards and special missions",
      badge: "Shadow Army badge on your profile",
      support: "Priority support"
    },
    tcHeader: "Terms & Conditions",
    tcScrollPrompt: "(Scroll to the bottom of Terms to unlock payment)",
    tcAgree: "I agree to the Terms & Conditions",
    tcText: [
      "All payments are final. No refunds on digital lifetime access.",
      "Access is tied to your registered Supabase account email.",
      "Sharing this website link is allowed — new visitors must pay separately.",
      "Victarc reserves the right to update features and content.",
      "Governed by the laws of Maharashtra, India."
    ],
    completePayment: "COMPLETE YOUR PAYMENT",
    scanUpi: "Scan with any UPI app",
    copied: "Copied! ✓",
    notice: "⚠️ After paying, come back here and upload your payment screenshot below. Access will be granted within 10 minutes.",
    ivePaid: "I've Paid, Upload Proof",
    uploadTitle: "UPLOAD PAYMENT PROOF",
    utrLabel: "Enter UPI Transaction ID / UTR Number",
    utrPlaceholder: "12-digit number from your UPI app",
    uploadProof: "Upload Payment Screenshot",
    dragDrop: "Drag & drop or click to upload screenshot",
    maxSize: "Max size: 5MB (JPG, PNG, WEBP)",
    submitVerify: "SUBMIT FOR VERIFICATION",
    verifying: "🔍 Verifying your payment automatically...",
    submitting: "Submitting details...",
    checking: "Checking details...",
    verifyingSteps: [
      "Screenshot received",
      "Analyzing payment details...",
      "Checking transaction ID...",
      "Verifying amount...",
      "Finalizing verification..."
    ]
  },
  hi: {
    title: "आपका परीक्षण समाप्त हो गया है।",
    subtitle: "क्या आप उठेंगे, शिकारी?",
    loginPrompt: "अपनी प्रगति को सहेजने और लाइफटाइम एक्सेस खरीदने के लिए कृपया लॉग इन करें या एक मुफ़्त प्रोफ़ाइल पंजीकृत करें।",
    loginBtn: "⚡ लॉगिन करें",
    registerBtn: "👑 प्रोफ़ाइल बनाएं",
    arankBadge: "A-श्रेणी",
    arankTitle: "A-श्रेणी शिकारी",
    arankPrice: "₹49",
    arankBtn: "₹49 में उठें",
    srankBadge: "S-श्रेणी ⭐ अनुशंसित",
    srankTitle: "S-RANK शिकारी",
    srankPrice: "₹99",
    srankBtn: "₹99 में उठें",
    features: {
      access: "हमेशा के लिए पूरी वेबसाइट तक पहुंच",
      quests: "सभी दैनिक खोज और कालकोठरी",
      xp: "XP प्रणाली और रैंक प्रगति",
      leaderboard: "वैश्विक लीडरबोर्ड तक पहुंच",
      onetime: "एक बार भुगतान — फिर कभी भुगतान न करें",
      early: "सभी उपयोगकर्ताओं से पहले नई सुविधाओं तक जल्दी पहुंच",
      rewards: "विशेष S-श्रेणी पुरस्कार और विशेष मिशन",
      badge: "आपकी प्रोफ़ाइल पर शैडो आर्मी बैज",
      support: "प्राथमिकता सहायता"
    },
    tcHeader: "नियम और शर्तें",
    tcScrollPrompt: "(भुगतान अनलॉक करने के लिए नियमों के अंत तक स्क्रॉल करें)",
    tcAgree: "मैं नियम और शर्तों से सहमत हूँ",
    tcText: [
      "सभी भुगतान अंतिम हैं। डिजिटल लाइफटाइम एक्सेस पर कोई रिफंड नहीं।",
      "पहुंच आपके पंजीकृत सुपरबेस खाता ईमेल से जुड़ी है।",
      "इस वेबसाइट लिंक को साझा करने की अनुमति है — नए आगंतुकों को अलग से भुगतान करना होगा।",
      "विक्टार्क के पास सुविधाओं और सामग्री को अपडेट करने का अधिकार सुरक्षित है।",
      "महाराष्ट्र, भारत के कानूनों द्वारा शासित।"
    ],
    completePayment: "अपना भुगतान पूरा करें",
    scanUpi: "किसी भी UPI ऐप से स्कैन करें",
    copied: "कॉपी किया गया! ✓",
    notice: "⚠️ भुगतान करने के बाद, यहां वापस आएं और नीचे अपना भुगतान स्क्रीनशॉट अपलोड करें। 10 मिनट के भीतर पहुंच प्रदान कर दी जाएगी।",
    ivePaid: "मैंने भुगतान कर दिया है, प्रमाण अपलोड करें",
    uploadTitle: "भुगतान का प्रमाण अपलोड करें",
    utrLabel: "UPI ट्रांजैक्शन आईडी / UTR नंबर दर्ज करें",
    utrPlaceholder: "आपके UPI ऐप से 12-अंकीय संख्या",
    uploadProof: "भुगतान स्क्रीनशॉट अपलोड करें",
    dragDrop: "स्क्रीनशॉट अपलोड करने के लिए खींचें और छोड़ें या क्लिक करें",
    maxSize: "अधिकतम आकार: 5MB (JPG, PNG, WEBP)",
    submitVerify: "सत्यापन के लिए जमा करें",
    verifying: "🔍 आपके भुगतान का स्वचालित रूप से सत्यापन किया जा रहा है...",
    submitting: "विवरण सबमिट किया जा रहा है...",
    checking: "जांच की जा रही है...",
    verifyingSteps: [
      "स्क्रीनशॉट प्राप्त हुआ",
      "भुगतान विवरण का विश्लेषण किया जा रहा है...",
      "लेन-देन आईडी की जाँच की जा रही है...",
      "राशि का सत्यापन किया जा रहा है...",
      "सत्यापन पूरा किया जा रहा है..."
    ]
  },
  mr: {
    title: "तुमची चाचणी संपली आहे.",
    subtitle: "तुम्ही उठणार का, शिकारी?",
    loginPrompt: "तुमची प्रगती जतन करण्यासाठी आणि लाइफटाइम प्रवेश खरेदी करण्यासाठी कृपया लॉग इन करा किंवा विनामूल्य प्रोफाइल नोंदवा.",
    loginBtn: "⚡ लॉगिन करा",
    registerBtn: "👑 प्रोफाइल नोंदवा",
    arankBadge: "A-श्रेणी",
    arankTitle: "A-श्रेणी शिकारी",
    arankPrice: "₹49",
    arankBtn: "₹49 मध्ये उठा",
    srankBadge: "S-श्रेणी ⭐ शिफारस केलेले",
    srankTitle: "S-RANK शिकारी",
    srankPrice: "₹99",
    srankBtn: "₹99 मध्ये उठा",
    features: {
      access: "नेहमीसाठी संपूर्ण वेबसाइटवर प्रवेश",
      quests: "सर्व दैनिक शोध आणि डन्जन्स",
      xp: "XP प्रणाली आणि रँक प्रगती",
      leaderboard: "ग्लोबल लीडरबोर्डवर प्रवेश",
      onetime: "एकदाच पेमेंट — पुन्हा कधीही पेमेंट करू नका",
      early: "सर्व वापरकर्त्यांआधी नवीन वैशिष्ट्यांमध्ये लवकर प्रवेश",
      rewards: "विशेष S-श्रेणी बक्षिसे आणि विशेष मिशन",
      badge: "तुमच्या प्रोफाईलवर शॅडो आर्मी बॅज",
      support: "प्राधान्य मदत"
    },
    tcHeader: "नियम आणि अटी",
    tcScrollPrompt: "(पेमेंट अनलॉक करण्यासाठी अटींच्या शेवटापर्यंत स्क्रोल करा)",
    tcAgree: "मी नियम आणि अटींशी सहमत आहे",
    tcText: [
      "सर्व पेमेंट अंतिम आहेत. डिजिटल लाइफटाइम प्रवेशावर कोणताही परतावा नाही.",
      "प्रवेश तुमच्या नोंदणीकृत सुपरबेस खाते ईमेलशी जोडलेला आहे.",
      "या वेबसाइटची लिंक शेअर करण्यास परवानगी आहे — नवीन अभ्यागतांनी स्वतंत्रपणे पेमेंट करणे आवश्यक आहे.",
      "व्हिक्टार्ककडे वैशिष्ट्ये आणि सामग्री अद्यतनित करण्याचा अधिकार राखीव आहे.",
      "महाराष्ट्र, भारत च्या कायद्यांद्वारे शासित."
    ],
    completePayment: "पेमेंट पूर्ण करा",
    scanUpi: "कोणत्याही UPI ॲपने स्कॅन करा",
    copied: "कॉपी केले! ✓",
    notice: "⚠️ पेमेंट केल्यानंतर, येथे परत या आणि खाली स्क्रीनशॉट अपलोड करा. 10 मिनिटांच्या आत प्रवेश दिला जाईल.",
    ivePaid: "मी पेमेंट केले आहे, पुरावा अपलोड करा",
    uploadTitle: "पेमेंट पुरावा अपलोड करा",
    utrLabel: "UPI ट्रान्झॅक्शन आयडी / UTR नंबर टाका",
    utrPlaceholder: "तुमच्या UPI ॲपवरील 12-अंकी नंबर",
    uploadProof: "पेमेंट स्क्रीनशॉट अपलोड करा",
    dragDrop: "स्क्रीनशॉट अपलोड करण्यासाठी ड्रॅग आणि ड्रॉप करा किंवा क्लिक करा",
    maxSize: "कमाल साईझ: 5MB (JPG, PNG, WEBP)",
    submitVerify: "सत्यापनासाठी सबमिट करा",
    verifying: "🔍 तुमच्या पेमेंटची स्वयंचलित पडताळणी केली जात आहे...",
    submitting: "माहिती सबमिट केली जात आहे...",
    checking: "तपासणी सुरू आहे...",
    verifyingSteps: [
      "स्क्रीनशॉट मिळाला",
      "पेमेंट तपशीलांचे विश्लेषण सुरू आहे...",
      "ट्रान्झॅक्शन आयडी तपासला जात आहे...",
      "रक्कम पडताळली जात आहे...",
      "पडताळणी पूर्ण केली जात आहे..."
    ]
  }
}

export default function PaywallModal({ user: initialUser, isOpen, onClose }: PaywallModalProps) {
  const [lang, setLang] = useState<Language>('en')
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser || null)
  const [tcExpanded, setTcExpanded] = useState(false)
  const [agreed, setAgreed] = useState(false)
  
  // Checkout flow step
  // 'plans' | 'pay' | 'upload' | 'verifying' | 'manual_pending' | 'rejected' | 'success'
  const [flowStep, setFlowStep] = useState<'plans' | 'pay' | 'upload' | 'verifying' | 'manual_pending' | 'rejected' | 'success'>('plans')
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('premium')
  
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

  const text = TRANSLATIONS[lang]

  // Check session on mount if user prop is missing
  useEffect(() => {
    if (currentUser) return
    const getSessionUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setCurrentUser(profile as User)
      }
    }
    getSessionUser()
  }, [supabase, currentUser])

  // Check for existing pending requests when modal opens
  useEffect(() => {
    if (!isOpen || !currentUser) return

    const checkPendingRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .select('id, plan, upi_transaction_id, status')
          .in('status', ['pending', 'pending_manual'])
          .eq('user_id', currentUser.id)
          .order('submitted_at', { ascending: false })
          .limit(1)

        if (!error && data && data[0]) {
          const req = data[0]
          setCreatedRequestId(req.id)
          setSelectedPlan(req.plan as 'basic' | 'premium')
          setUtrNumber(req.upi_transaction_id || '')
          setFlowStep('manual_pending')
        }
      } catch (err) {
        console.error('Error checking pending payment requests:', err)
      }
    }

    checkPendingRequest()
  }, [isOpen, currentUser, supabase])



  // Clean preview URLs to prevent leaks
  useEffect(() => {
    return () => {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview)
      }
    }
  }, [screenshotPreview])

  // Copy UPI ID to clipboard
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_CONFIG.upiId)
    setCopiedTooltip(true)
    setTimeout(() => setCopiedTooltip(false), 2000)
  }

  // Handle file select
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

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0])
    }
  }

  // Submit payment request and run verification
  const handleSubmitVerification = async () => {
    if (!currentUser || !screenshotFile || !utrNumber) return

    setFlowStep('verifying')
    setCurrentStepIndex(0)
    setVerificationError(null)

    try {
      // Step 1: Upload screenshot to private storage
      const fileId = typeof window !== 'undefined' && window.crypto?.randomUUID 
        ? window.crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15)
      
      const fileExt = screenshotFile.name.split('.').pop() || 'jpg'
      const filePath = `${currentUser.id}/${fileId}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, screenshotFile)

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      // Update progress step
      setCurrentStepIndex(1)
      await new Promise(r => setTimeout(r, 1200)) // delay for visual feedback

      const expectedAmount = selectedPlan === 'premium' ? 99 : 49

      // Step 2: Insert row in payment_requests table
      const { data: reqData, error: dbError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: currentUser.id,
          user_email: currentUser.email,
          user_name: currentUser.username,
          plan: selectedPlan,
          amount: expectedAmount,
          upi_transaction_id: utrNumber,
          screenshot_url: filePath,
          status: 'pending',
          verified_by: 'pending'
        })
        .select()
        .single()

      if (dbError) throw new Error(`Database error: ${dbError.message}`)
      setCreatedRequestId(reqData.id)

      setCurrentStepIndex(2)
      await new Promise(r => setTimeout(r, 1000))

      setCurrentStepIndex(3)

      // Step 3: Trigger AI Vision check
      const verifyRes = await fetch('/api/verify-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqData.id,
          screenshotUrl: filePath,
          expectedAmount,
          upiId: UPI_CONFIG.upiId,
          userName: currentUser.username
        })
      })

      setCurrentStepIndex(4)
      await new Promise(r => setTimeout(r, 800))

      const verifyResult = await verifyRes.json()

      if (!verifyRes.ok) {
        throw new Error(verifyResult.error || 'AI analysis failed')
      }

      if (verifyResult.approved) {
        // AI approved! Update user state
        await supabase.auth.refreshSession()
        setFlowStep('success')
      } else if (verifyResult.manualReview) {
        // AI flagged for manual
        setFlowStep('manual_pending')
      } else if (verifyResult.rejected) {
        // AI rejected
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

  // Poll database status check for manual pending request
  const checkManualRequestStatus = async () => {
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
        setPollingStatusText('Approved! Refreshing session...')
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
      setPollingStatusText('Failed to fetch status.')
      setIsPolling(false)
    }
  }

  if (!isOpen) return null

  // Success view (passes down details to SuccessScreen)
  if (flowStep === 'success') {
    return (
      <SuccessScreen 
        user={currentUser!}
        plan={selectedPlan}
        paymentId={createdRequestId || 'UPI_AI_APPROVE'}
        paidAt={new Date().toISOString()}
      />
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-4xl bg-neutral-950 border border-purple-500/40 rounded-2xl shadow-[0_0_50px_rgba(124,58,237,0.3)] p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button (only visible if user has a paid plan already) */}
          {currentUser && currentUser.plan && currentUser.plan !== 'demo' && (
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full bg-white/5 z-20"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* LANGUAGE SWITCHER */}
          {flowStep === 'plans' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="text-left">
                <h1 className="text-2xl font-exo2 font-black uppercase text-white tracking-widest leading-none">
                  {text.title}
                </h1>
                <p className="text-base font-exo2 font-bold text-purple-500 tracking-wider mt-1.5 uppercase">
                  {text.subtitle}
                </p>
              </div>

              <div className="relative bg-black/60 border border-white/10 rounded-lg p-0.5 flex items-center self-start md:self-auto gap-0.5">
                {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`relative px-4 py-1.5 rounded text-xs font-rajdhani font-bold uppercase tracking-wider z-10 transition-colors duration-200 ${
                      lang === l ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'मराठी'}
                    {lang === l && (
                      <motion.div
                        layoutId="activeLangTab"
                        className="absolute inset-0 bg-purple-600 rounded -z-10"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: PLANS AND T&C APPROVAL */}
          {flowStep === 'plans' && (
            <>
              {!currentUser ? (
                <div className="flex flex-col items-center text-center p-8 border border-white/5 bg-black/40 rounded-xl max-w-xl mx-auto space-y-6">
                  <div className="w-16 h-16 rounded-full border border-purple-500/40 flex items-center justify-center bg-purple-950/20 text-purple-400">
                    <LogIn className="w-8 h-8 stroke-[1.5px]" />
                  </div>
                  <p className="font-rajdhani text-sm text-neutral-300 leading-relaxed max-w-sm">
                    {text.loginPrompt}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <a 
                      href="/login" 
                      className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest text-center shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all duration-200"
                    >
                      {text.loginBtn}
                    </a>
                    <a 
                      href="/login?tab=register" 
                      className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 rounded-lg font-exo2 font-black text-xs uppercase tracking-widest text-center transition-all duration-200"
                    >
                      {text.registerBtn}
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* CARD 1: A-RANK */}
                    <div className="p-6 rounded-xl border border-purple-500/20 bg-purple-950/5 flex flex-col justify-between gap-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded bg-orange-950/30 border border-orange-500/30 font-exo2 font-black text-[10px] text-orange-400 tracking-wider">
                            {text.arankBadge}
                          </span>
                          <span className="font-mono font-bold text-2xl text-white font-rajdhani tracking-wider">{text.arankPrice}</span>
                        </div>

                        <h3 className="font-exo2 font-black text-lg text-white uppercase tracking-wider">{text.arankTitle}</h3>
                        <div className="h-px bg-white/5" />

                        <ul className="space-y-2 text-left font-rajdhani text-sm text-neutral-300">
                          {[
                            text.features.access,
                            text.features.quests,
                            text.features.xp,
                            text.features.leaderboard,
                            text.features.onetime
                          ].map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        disabled={!agreed}
                        onClick={() => {
                          setSelectedPlan('basic')
                          setFlowStep('pay')
                        }}
                        className={`w-full py-4 rounded-lg font-exo2 font-black text-xs uppercase tracking-widest border transition-all duration-200 ${
                          agreed 
                            ? 'bg-purple-600 border-purple-500 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]' 
                            : 'bg-neutral-900 border-white/5 text-neutral-600 cursor-not-allowed'
                        }`}
                      >
                        {text.arankBtn}
                      </button>
                    </div>

                    {/* CARD 2: S-RANK */}
                    <div className="p-6 rounded-xl border-2 border-purple-500 bg-purple-950/10 flex flex-col justify-between gap-6 shadow-[0_0_30px_rgba(124,58,237,0.25)] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-cyan-500/5 -z-10" />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded bg-yellow-950/30 border border-yellow-500/30 font-exo2 font-black text-[10px] text-yellow-400 tracking-wider">
                            {text.srankBadge}
                          </span>
                          <span className="font-mono font-bold text-2xl text-white font-rajdhani tracking-wider">{text.srankPrice}</span>
                        </div>

                        <h3 className="font-exo2 font-black text-lg text-white uppercase tracking-wider flex items-center gap-1.5">
                          {text.srankTitle} <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                        </h3>
                        <div className="h-px bg-white/10" />

                        <ul className="space-y-2 text-left font-rajdhani text-sm text-neutral-200">
                          {[
                            text.features.access,
                            text.features.quests,
                            text.features.xp,
                            text.features.leaderboard,
                            text.features.onetime,
                            text.features.early,
                            text.features.rewards,
                            text.features.badge,
                            text.features.support
                          ].map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        disabled={!agreed}
                        onClick={() => {
                          setSelectedPlan('premium')
                          setFlowStep('pay')
                        }}
                        className={`w-full py-4 rounded-lg font-exo2 font-black text-xs uppercase tracking-widest border transition-all duration-200 ${
                          agreed 
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 border-yellow-400 hover:from-yellow-400 hover:to-amber-500 text-black shadow-[0_0_20px_rgba(251,191,36,0.35)]' 
                            : 'bg-neutral-900 border-white/5 text-neutral-600 cursor-not-allowed'
                        }`}
                      >
                        {text.srankBtn}
                      </button>
                    </div>
                  </div>

                  {/* T&C BLOCK */}
                  <div className="border border-white/5 rounded-xl bg-black/40 overflow-hidden">
                    <button
                      onClick={() => setTcExpanded(!tcExpanded)}
                      className="w-full p-4 flex items-center justify-between font-rajdhani font-bold text-sm text-neutral-300 hover:text-white transition-colors duration-150"
                    >
                      <span className="flex items-center gap-2">
                        📜 {text.tcHeader}
                      </span>
                      {tcExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                      {tcExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-white/5"
                        >
                          <div className="p-4 max-h-60 sm:max-h-40 overflow-y-auto space-y-2 font-rajdhani text-xs text-neutral-400 leading-relaxed">
                            {text.tcText.map((p, i) => (
                              <p key={i} className="pb-1">
                                {p}
                              </p>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* AGREE CHECKBOX */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 font-rajdhani text-sm text-neutral-200 mt-4"
                  >
                    <input
                      type="checkbox"
                      id="tc-checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-900 text-purple-600 accent-purple-600 cursor-pointer"
                    />
                    <label htmlFor="tc-checkbox" className="cursor-pointer font-semibold uppercase tracking-wider text-xs select-none">
                      {text.tcAgree}
                    </label>
                  </motion.div>

                  {/* Terms / Privacy / Refund quick links */}
                  <div className="flex justify-center gap-4 mt-2 font-rajdhani text-[10px] text-neutral-500 uppercase tracking-widest">
                    <Link href="/terms" target="_blank" className="hover:text-purple-400 transition-colors underline underline-offset-2">Terms</Link>
                    <span>·</span>
                    <Link href="/privacy" target="_blank" className="hover:text-purple-400 transition-colors underline underline-offset-2">Privacy</Link>
                    <span>·</span>
                    <Link href="/refund" target="_blank" className="hover:text-purple-400 transition-colors underline underline-offset-2">Refund</Link>
                  </div>
                </>
              )}
            </>
          )}

          {/* STEP 1 (FLOW): UPI QR & DETAILS SCREEN */}
          {flowStep === 'pay' && (
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex flex-col items-center gap-6 max-w-xl mx-auto w-full text-center"
            >
              <h2 className="text-xl font-exo2 font-black uppercase text-purple-400 tracking-wider">
                {text.completePayment}
              </h2>

              {/* Compact Plan Summary */}
              <div className="w-full p-4 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center text-left">
                <div>
                  <h4 className="font-exo2 font-black text-sm uppercase text-white">
                    {selectedPlan === 'premium' ? text.srankTitle : text.arankTitle}
                  </h4>
                  <p className="font-rajdhani text-xs text-neutral-400 mt-0.5">Lifetime access unlocked instantly</p>
                </div>
                <span className="font-mono text-xl font-bold text-yellow-500">
                  {selectedPlan === 'premium' ? text.srankPrice : text.arankPrice}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-purple-500/30 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/qr.jpg" alt="GPay QR" className="w-48 h-48 object-contain" />
              </div>

              <div className="space-y-1">
                <p className="font-rajdhani text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  {text.scanUpi}
                </p>
                
                {/* Copyable UPI ID */}
                <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md cursor-pointer group mt-2" onClick={handleCopyUpi}>
                  <code className="font-mono text-sm text-purple-400 font-semibold">{UPI_CONFIG.upiId}</code>
                  <Copy className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                  
                  {/* Tooltip */}
                  <AnimatePresence>
                    {copiedTooltip && (
                      <motion.span 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: -25 }}
                        exit={{ opacity: 0 }}
                        className="absolute bg-purple-600 text-white text-[10px] font-rajdhani font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider left-1/2 -translate-x-1/2"
                      >
                        {text.copied}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* UPI Deep links */}
              <div className="flex flex-wrap justify-center gap-3 w-full mt-2">
                {[
                  { name: 'GPay', emoji: '📱' },
                  { name: 'PhonePe', emoji: '📱' },
                  { name: 'Paytm', emoji: '📱' },
                  { name: 'BHIM', emoji: '📱' }
                ].map((app) => (
                  <a
                    key={app.name}
                    href={UPI_CONFIG.plans[selectedPlan].upiDeeplink(UPI_CONFIG.upiId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-purple-500/30 hover:border-purple-500 bg-purple-950/10 hover:bg-purple-950/30 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider text-neutral-200 transition-colors"
                  >
                    {app.emoji} {app.name}
                  </a>
                ))}
              </div>

              {/* Large Price Display */}
              <div className="text-4xl font-exo2 font-black text-yellow-500 tracking-wider">
                {selectedPlan === 'premium' ? text.srankPrice : text.arankPrice}
              </div>

              {/* Important Notice */}
              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-950/10 text-left flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="font-rajdhani text-xs text-neutral-300 leading-relaxed">
                  {text.notice}
                </p>
              </div>

              {/* Proceed Buttons */}
              <div className="flex gap-4 w-full pt-4 border-t border-white/5">
                <button
                  onClick={() => setFlowStep('plans')}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-lg font-exo2 font-black text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setFlowStep('upload')}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-colors"
                >
                  {text.ivePaid}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PROOF UPLOAD SCREEN */}
          {flowStep === 'upload' && (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex flex-col gap-6 max-w-xl mx-auto w-full text-left"
            >
              <h2 className="text-xl font-exo2 font-black uppercase text-purple-400 tracking-wider text-center">
                {text.uploadTitle}
              </h2>

              {/* UTR Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-neutral-400 uppercase tracking-widest">
                  {text.utrLabel}
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={text.utrPlaceholder}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 font-rajdhani text-sm text-white placeholder:text-neutral-600 tracking-widest"
                />
              </div>

              {/* Upload Drop Zone */}
              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-neutral-400 uppercase tracking-widest">
                  {text.uploadProof}
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
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
                    // Preview
                    <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={screenshotPreview} 
                        alt="Screenshot proof preview" 
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
                    // Upload Placeholder
                    <>
                      <Upload className="w-8 h-8 text-purple-400 stroke-[1.5]" />
                      <div className="text-center">
                        <p className="font-rajdhani text-sm font-bold text-neutral-200">{text.dragDrop}</p>
                        <p className="font-rajdhani text-[11px] text-neutral-500 mt-1">{text.maxSize}</p>
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
                  {text.submitVerify}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: AUTOMATED VERIFY LOADER (AI PROGRESS BAR) */}
          {flowStep === 'verifying' && (
            <div className="flex flex-col items-center justify-center p-8 gap-8 max-w-md mx-auto w-full">
              <div className="relative w-20 h-20">
                {/* Glowing AI Spinner Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                {/* Scanner Purple laser overlay */}
                <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-b from-purple-500/0 via-purple-500/30 to-purple-500/0 h-1/2 top-1/4 animate-pulse rounded-md" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-exo2 font-black text-base uppercase text-white tracking-widest">
                  Analyzing Payment
                </h3>
                <p className="font-rajdhani text-xs text-neutral-400 animate-pulse">
                  {text.verifying}
                </p>
              </div>

              {/* Progress Stepper checklist */}
              <div className="w-full space-y-3 bg-white/[0.02] border border-white/5 p-5 rounded-xl text-left">
                {text.verifyingSteps.map((step, idx) => {
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
                      <span>{step}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4: MANUAL REVIEW LAYOUT (PENDING VIEW) */}
          {flowStep === 'manual_pending' && (
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
                  Our system needs to review your proof manually. Access is typically granted within 2 hours.
                </p>
              </div>

              {/* Request Details */}
              <div className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-lg font-mono text-left space-y-1.5 text-xs text-neutral-400">
                <p>Request ID: <span className="text-white">{createdRequestId.slice(0, 8)}...</span></p>
                <p>UTR No: <span className="text-white">{utrNumber}</span></p>
                <p>Status: <span className="text-yellow-500 font-bold uppercase">Pending Manual Review</span></p>
              </div>

              {pollingStatusText && (
                <p className="font-rajdhani text-xs text-purple-400 font-bold animate-pulse">
                  {pollingStatusText}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 w-full mt-4">
                <button
                  disabled={isPolling}
                  onClick={checkManualRequestStatus}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  {isPolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Check Status
                </button>
                <button
                  onClick={() => {
                    onClose()
                    // Dispatch custom event to tell dashboard to swap to payment status tab
                    window.dispatchEvent(new CustomEvent('switch-dashboard-tab', { detail: 'payments' }))
                  }}
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-400 hover:text-white rounded-lg font-exo2 font-black text-xs uppercase tracking-widest transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: AI REJECTED LAYOUT */}
          {flowStep === 'rejected' && (
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

              {/* Guidelines tips box */}
              <div className="w-full text-left bg-white/[0.01] border border-white/5 p-5 rounded-xl space-y-2">
                <h4 className="font-rajdhani text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Make sure your screenshot shows:
                </h4>
                <ul className="space-y-1.5 font-rajdhani text-xs text-neutral-400">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Payment SUCCESS status (Completed / Successful)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Correct amount: ₹{selectedPlan === 'premium' ? 99 : 49}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Full 12-digit transaction ID (UTR number) visible
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Clear layout directly from GPay, PhonePe, Paytm, or BHIM
                  </li>
                </ul>
              </div>

              {/* Actions */}
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

        </motion.div>
      </div>
    </AnimatePresence>
  )
}
