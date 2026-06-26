import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — VICTARC',
  description: 'Privacy policy for users of the VICTARC Solo Leveling fitness gamification platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#05050b] text-neutral-200 py-16 px-6 font-rajdhani">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center text-xs font-exo2 font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors duration-150"
        >
          ← Return to Home
        </Link>

        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-4xl font-exo2 font-black uppercase tracking-widest text-white">
            Privacy Policy
          </h1>
          <p className="text-xs text-neutral-500 uppercase tracking-widest mt-2">
            Last Updated: June 2026
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              1. Information We Collect
            </h2>
            <p>
              We collect minimal information required to manage your account profile and verify challenge progress:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 text-neutral-400">
              <li><strong>Account Credentials</strong>: Name, email address, and username.</li>
              <li><strong>Profile Metrics</strong>: Level, rank progress, coins, achievements, and completed challenges.</li>
              <li><strong>Quest Proofs</strong>: Texts and verification photos uploaded when completing fitness/discipline tasks.</li>
              <li><strong>Transaction Records</strong>: Razorpay payment order IDs and confirmation tokens (we do NOT store credit cards or raw bank details).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              2. How We Use Your Data
            </h2>
            <p>
              Your data is utilized solely for operating and securing the gamified experience:
            </p>
            <p>
              Supabase handles auth sessions and database hosting. Proof photos are stored in Supabase Storage buckets. 
              We do not sell, rent, or trade your personal data, usernames, or email lists to third parties for advertising or commercial purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              3. Payment Processing Data
            </h2>
            <p>
              Monetized access payments are processed securely through our gateway partner, **Razorpay**. 
              Your credit card details, UPI info, or banking credentials are sent directly to Razorpay. 
              For information on how Razorpay processes transaction details securely, please read the **[Razorpay Privacy Policy](https://razorpay.com/privacy)**.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              4. Cookies and Session Tokens
            </h2>
            <p>
              We utilize cookies only to persist your logged-in Supabase session. We do not use third-party tracking, profiling cookies, or marketing tags.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              5. Account Deletion and Rights
            </h2>
            <p>
              You have the right to request deletion of your account and all associated profile progress, emails, and uploaded proofs from our database. To request account deletion, please email support.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              6. Contact Hunter Association
            </h2>
            <p>
              If you have any queries about our privacy practices, please contact us at: <strong className="text-purple-400">support@victarc.in</strong>.
            </p>
          </section>
        </div>

        {/* Footer info */}
        <div className="border-t border-white/5 pt-6 text-center text-xs text-neutral-500 uppercase tracking-widest">
          VICTARC © 2026 · ALL RIGHTS RESERVED
        </div>

      </div>
    </div>
  )
}
