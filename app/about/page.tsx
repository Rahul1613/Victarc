import RiseNavbar from '@/components/RiseNavbar'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#020B08] pb-24 md:pb-0 md:pt-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <h1 className="text-2xl md:text-4xl font-bold text-[#F5F7F6] mb-6 md:mb-8">About RISE</h1>
        
        <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)] mb-6">
          <h2 className="text-xl font-bold text-[#32E89A] mb-3">Our Mission</h2>
          <p className="text-sm md:text-base text-[#AAB5B1] leading-relaxed">
            RISE Journal is designed to help you build consistent habits, track your progress, and achieve your personal goals. 
            We believe that small daily actions lead to extraordinary results over time.
          </p>
        </div>

        <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)] mb-6">
          <h2 className="text-xl font-bold text-[#32E89A] mb-3">Features</h2>
          <ul className="space-y-2 text-sm md:text-base text-[#AAB5B1]">
            <li className="flex items-start gap-2">
              <span className="text-[#32E89A]">•</span>
              <span>Daily journaling with rich text editor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#32E89A]">•</span>
              <span>Task tracking and habit building</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#32E89A]">•</span>
              <span>Progress statistics and streak tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#32E89A]">•</span>
              <span>Challenges and achievements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#32E89A]">•</span>
              <span>Calendar view for easy navigation</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)] mb-6">
          <h2 className="text-xl font-bold text-[#32E89A] mb-3">Privacy</h2>
          <p className="text-sm md:text-base text-[#AAB5B1] leading-relaxed">
            Your journal entries are private and secure. We use industry-standard encryption to protect your data. 
            You can export your data at any time from the Profile page.
          </p>
        </div>

        <div className="bg-[#0D1916] rounded-2xl p-5 md:p-6 border border-[rgba(100,255,190,0.12)]">
          <h2 className="text-xl font-bold text-[#32E89A] mb-3">Version</h2>
          <p className="text-sm md:text-base text-[#AAB5B1]">
            RISE Journal v1.0.0
          </p>
        </div>
      </div>

      <RiseNavbar />
    </div>
  )
}
