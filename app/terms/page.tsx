import Link from 'next/link'

export const metadata = {
  title: 'Terms & Conditions — VICTARC',
  description: 'Terms and conditions for using the VICTARC Solo Leveling fitness gamification platform.',
}

export default function TermsPage() {
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
            Terms & Conditions
          </h1>
          <p className="text-xs text-neutral-500 uppercase tracking-widest mt-2">
            Last Updated: June 2026
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Victarc website (victarc.in), services, or mobile applications, you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the website.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              2. Service Description
            </h2>
            <p>
              Victarc is a fitness and self-growth gamification platform inspired by the Solo Leveling anime theme. Users complete daily quests, submit verification proofs, earn XP, unlock profile cosmetics, and compete on a global leaderboard. All services are provided &quot;as is&quot; and Victarc reserves the right to modify or discontinue any feature at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              3. Payments and Monetization
            </h2>
            <p>
              Victarc offers digital lifetime access tiers (A-Rank Hunter and S-Rank Hunter) for premium gamification features. 
            </p>
            <p>
              <strong>All payments are final.</strong> Because digital products are delivered immediately upon successful transaction, we offer no refunds or cancellations once lifetime access is granted. Lifetime access is tied directly to your registered Supabase account email and cannot be transferred or shared.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              4. User Responsibilities
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You agree to provide honest verification proof (photos, texts) when submitting completed challenges. Submitting false proofs, spamming, or violating the community rules may result in immediate suspension or termination of your account without warning or refund.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              5. Intellectual Property
            </h2>
            <p>
              All website designs, texts, graphics, logos, icons, badges, UI elements, and software code are the intellectual property of Victarc. You are permitted to share links to the website and display your profile card elsewhere, but you may not scrape, clone, or redistribute Victarc assets for commercial gain.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              6. Limitation of Liability
            </h2>
            <p>
              Victarc is not liable for any physical injuries, health conditions, or damages resulting from the physical workout tasks or challenges completed by users. Consult a medical professional before starting any new exercise routine.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              7. Governing Law
            </h2>
            <p>
              These Terms & Conditions shall be governed by and construed in accordance with the laws of the State of Maharashtra, India. Any dispute arising out of or related to these terms shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra, India.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              8. Contact Support
            </h2>
            <p>
              If you have any questions, concerns, or technical issues regarding payments or terms, please contact our Hunter Association at: <strong className="text-purple-400">support@victarc.in</strong>.
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
