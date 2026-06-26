'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, ChevronUp, Loader2, LogIn, Sparkles, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import SuccessScreen from './SuccessScreen'

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
    errorTitle: "Payment Failed",
    errorRetry: "Retry Payment",
    processing: "Processing Order..."
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
    errorTitle: "भुगतान विफल रहा",
    errorRetry: "पुनः प्रयास करें",
    processing: "ऑर्डर प्रोसेसिंग में है..."
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
    errorTitle: "पेमेंट यशस्वी झाले नाही",
    errorRetry: "पुन्हा प्रयत्न करा",
    processing: "ऑर्डर प्रक्रिया सुरू आहे..."
  }
}

export default function PaywallModal({ user: initialUser, isOpen, onClose }: PaywallModalProps) {
  const [lang, setLang] = useState<Language>('en')
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser || null)
  const [tcExpanded, setTcExpanded] = useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [agreed, setAgreed] = useState(false)
  
  // Payment states
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [verifiedPaymentId, setVerifiedPaymentId] = useState('')
  const [verifiedPaidAt, setVerifiedPaidAt] = useState('')
  const [verifiedPlan, setVerifiedPlan] = useState<'basic' | 'premium'>('basic')

  const supabase = createClient()
  const lastParaRef = useRef<HTMLParagraphElement | null>(null)
  const tcContainerRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

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

  // Setup IntersectionObserver for Terms & Conditions scroll requirement
  useEffect(() => {
    if (!tcExpanded) return

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting) {
        setHasScrolledToBottom(true)
      }
    }

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: tcContainerRef.current,
      threshold: 0.8,
    })

    if (lastParaRef.current) {
      observerRef.current.observe(lastParaRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [tcExpanded])

  // Load Razorpay Script Dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Handle Checkout initiation
  const handleArisePayment = async (planType: 'basic' | 'premium') => {
    if (!currentUser) return
    if (!agreed) return

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // 1. Create order on backend API
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planType, email: currentUser.email })
      })

      if (!res.ok) throw new Error('Failed to create Razorpay order')
      const order = await res.json()

      // 2. Load Checkout script
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) throw new Error('Razorpay SDK failed to load. Check your network.')

      // 3. Open Checkout window
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: order.amount,
        currency: order.currency,
        name: 'VICTARC',
        description: planType === 'premium' ? 'S-Rank Hunter Lifetime Access' : 'A-Rank Hunter Lifetime Access',
        order_id: order.orderId,
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          // On Payment Success, call server verify-payment
          setIsProcessing(true)
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan: planType,
                supabase_user_id: currentUser.id
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed')
            }

            // Success flow
            setVerifiedPaymentId(response.razorpay_payment_id)
            setVerifiedPaidAt(new Date().toISOString())
            setVerifiedPlan(planType)
            
            // Refresh session to update user plan cookies/session
            await supabase.auth.refreshSession()
            
            setShowSuccess(true)
          } catch (err: unknown) {
            setPaymentError(err instanceof Error ? err.message : 'Payment verification failed.')
          } finally {
            setIsProcessing(false)
          }
        },
        prefill: {
          name: currentUser.username || '',
          email: currentUser.email || ''
        },
        theme: {
          color: '#7c3aed'
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false)
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: unknown) {
      console.error(err)
      setPaymentError(err instanceof Error ? err.message : 'Error processing checkout order.')
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  if (showSuccess) {
    return (
      <SuccessScreen 
        user={currentUser!}
        plan={verifiedPlan}
        paymentId={verifiedPaymentId}
        paidAt={verifiedPaidAt}
      />
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-4xl bg-neutral-950 border border-purple-500/40 rounded-2xl shadow-[0_0_50px_rgba(124,58,237,0.3)] p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button (only visible if user has a paid plan, otherwise mandatory checkout) */}
          {currentUser && currentUser.plan && currentUser.plan !== 'demo' && (
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Language Switcher & Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="text-left">
              <h1 className="text-2xl font-exo2 font-black uppercase text-white tracking-widest leading-none">
                {text.title}
              </h1>
              <p className="text-base font-exo2 font-bold text-purple-500 tracking-wider mt-1.5 uppercase">
                {text.subtitle}
              </p>
            </div>

            {/* Language switch tabs */}
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

          {/* Processing Loading Spinner overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/85 z-50 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <span className="font-rajdhani text-sm text-purple-300 font-bold uppercase tracking-widest animate-pulse">
                {text.processing}
              </span>
            </div>
          )}

          {/* Error Alert Display */}
          {paymentError && (
            <div className="p-4 rounded border border-red-500 bg-red-950/20 text-red-400 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-rajdhani text-sm font-bold">{paymentError}</span>
              <button 
                onClick={() => setPaymentError(null)} 
                className="px-3 py-1 bg-red-900/40 hover:bg-red-900/70 border border-red-500/40 rounded text-xs font-rajdhani font-bold uppercase tracking-wider transition-colors duration-150"
              >
                Clear
              </button>
            </div>
          )}

          {/* CHECK IF USER IS LOGGED IN */}
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
              {/* TWO PRICING CARDS */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* CARD 1: A-RANK */}
                <div className="p-6 rounded-xl border border-purple-500/20 bg-purple-950/5 flex flex-col justify-between gap-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded bg-orange-950/30 border border-orange-500/30 font-exo2 font-black text-[10px] text-orange-400 tracking-wider shadow-[0_0_10px_rgba(249,115,22,0.1)]">
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
                    onClick={() => handleArisePayment('basic')}
                    className={`w-full py-4 rounded-lg font-exo2 font-black text-xs uppercase tracking-widest border transition-all duration-200 ${
                      agreed 
                        ? 'bg-purple-600 border-purple-500 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]' 
                        : 'bg-neutral-900 border-white/5 text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    {text.arankBtn}
                  </button>
                </div>

                {/* CARD 2: S-RANK RECOMMENDED */}
                <div className="p-6 rounded-xl border-2 border-purple-500 bg-purple-950/10 flex flex-col justify-between gap-6 shadow-[0_0_30px_rgba(124,58,237,0.25)] relative overflow-hidden group">
                  
                  {/* Subtle pulsing background glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-cyan-500/5 -z-10 group-hover:scale-105 transition-transform duration-500" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded bg-yellow-950/30 border border-yellow-500/30 font-exo2 font-black text-[10px] text-yellow-400 tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.2)]">
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
                    onClick={() => handleArisePayment('premium')}
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

              {/* COLLAPSIBLE TERMS & CONDITIONS */}
              <div className="border border-white/5 rounded-xl bg-black/40 overflow-hidden">
                <button
                  onClick={() => setTcExpanded(!tcExpanded)}
                  className="w-full p-4 flex items-center justify-between font-rajdhani font-bold text-sm text-neutral-300 hover:text-white transition-colors duration-150"
                >
                  <span className="flex items-center gap-2">
                    📜 {text.tcHeader}
                    {!hasScrolledToBottom && (
                      <span className="text-[10px] font-medium text-purple-400 tracking-wider">
                        {text.tcScrollPrompt}
                      </span>
                    )}
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
                      {/* Scroll container requiring observer */}
                      <div 
                        ref={tcContainerRef}
                        className="p-4 max-h-40 overflow-y-auto space-y-2 font-rajdhani text-xs text-neutral-400 leading-relaxed scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-500/20"
                      >
                        {text.tcText.map((p, i) => {
                          const isLast = i === text.tcText.length - 1
                          return (
                            <p 
                              key={i} 
                              ref={isLast ? lastParaRef : null}
                              className="pb-1"
                            >
                              {p}
                            </p>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* AGREE CHECKBOX */}
              {hasScrolledToBottom && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 font-rajdhani text-sm text-neutral-200"
                >
                  <input
                    type="checkbox"
                    id="tc-checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-900 text-purple-600 accent-purple-600 cursor-pointer"
                  />
                  <label htmlFor="tc-checkbox" className="cursor-pointer font-semibold uppercase tracking-wider text-xs">
                    {text.tcAgree}
                  </label>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
