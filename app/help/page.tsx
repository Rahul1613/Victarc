import RiseNavbar from '@/components/RiseNavbar'
import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#020B08] pb-24 md:pb-0 md:pt-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <h1 className="text-2xl md:text-4xl font-bold text-[#F5F7F6] mb-6 md:mb-8">Help & Support</h1>
        
        <div className="space-y-4">
          <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
            <h3 className="text-lg font-bold text-[#32E89A] mb-2">How do I write a journal entry?</h3>
            <p className="text-sm md:text-base text-[#AAB5B1]">
              Go to the Journal page and click the "Write Entry" button, or use the "Write Today's Entry" button on the Home page.
            </p>
          </div>

          <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
            <h3 className="text-lg font-bold text-[#32E89A] mb-2">How do I track my daily tasks?</h3>
            <p className="text-sm md:text-base text-[#AAB5B1]">
              On the Home page, you can add daily tasks in the Daily Tasks section. Click the checkbox to mark tasks as complete.
            </p>
          </div>

          <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
            <h3 className="text-lg font-bold text-[#32E89A] mb-2">What are challenges?</h3>
            <p className="text-sm md:text-base text-[#AAB5B1]">
              Challenges are long-term goals like the Winter Challenge. Complete 30 days of journaling to earn badges and track your progress.
            </p>
          </div>

          <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
            <h3 className="text-lg font-bold text-[#32E89A] mb-2">How do I export my journal?</h3>
            <p className="text-sm md:text-base text-[#AAB5B1]">
              Go to Profile and click "Export Journal" to download all your entries as a JSON file.
            </p>
          </div>

          <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
            <h3 className="text-lg font-bold text-[#32E89A] mb-2">Need more help?</h3>
            <p className="text-sm md:text-base text-[#AAB5B1]">
              Contact us at support@risejournal.com for additional assistance.
            </p>
          </div>
        </div>
      </div>

      <RiseNavbar />
    </div>
  )
}
