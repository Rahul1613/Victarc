import Link from 'next/link'

export const metadata = {
  title: 'Refund Policy — VICTARC',
  description: 'Refund policy for digital purchases on the VICTARC Solo Leveling fitness gamification platform.',
}

export default function RefundPage() {
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
            Cancellation & Refund Policy
          </h1>
          <p className="text-xs text-neutral-500 uppercase tracking-widest mt-2">
            Last Updated: June 2026
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              1. Digital Lifetime Product Nature
            </h2>
            <p>
              Victarc (victarc.in) provides one-time digital purchase packages (A-Rank Hunter and S-Rank Hunter) that immediately grant lifetime access to advanced gamification tools, quests, and rankings. 
            </p>
            <p>
              Because digital lifetime access is activated immediately upon successful transaction and database updates, **all payments are final, non-cancellable, and non-refundable.** We do not offer cooling-off periods or try-before-buy refunds.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              2. Technical Access Exception
            </h2>
            <p>
              The only exception to our no-refund policy is if a technical error occurs during checkout that blocks your account upgrade. 
            </p>
            <p>
              If your payment was processed successfully but your account remains on the &quot;demo&quot; plan, and our support team is unable to manually activate your access within **24 hours** of purchase, you will be eligible for a full refund of the amount paid.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              3. Processing Refund Timeline
            </h2>
            <p>
              Approved refunds will be processed through our gateway partner (Razorpay) back to the original payment source (UPI, Card, Net Banking). 
              Refunds usually take **5 to 7 working days** to reflect in your bank account once initiated by our association.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-exo2 font-black uppercase text-purple-400 tracking-wider">
              4. Contact for Refund Disputes
            </h2>
            <p>
              To file a claim under the technical access exception or report double-charge payments, please email us with your registered account details and transaction receipt: <strong className="text-purple-400">support@victarc.in</strong>.
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
