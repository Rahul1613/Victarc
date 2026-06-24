# VICTARC — Arise. Complete. Dominate.

A full-stack fitness and self-growth challenge platform with a Solo Levelling anime aesthetic. Users complete daily/weekly challenges to earn XP, rank up (E→SSS), and compete on a global leaderboard.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS 3**
- **Framer Motion 11**
- **Supabase** (Auth + Database + Realtime)
- **shadcn/ui**

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/victarc.git
cd victarc
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In the Supabase SQL Editor, paste and run the contents of `supabase/schema.sql`
3. This creates all tables, the leaderboard view, RLS policies, the trigger, and seeds challenge data
4. (Optional) Enable Google OAuth in **Authentication → Providers → Google**

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase project URL and anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push code to a GitHub repo
2. Import at [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### DNS Configuration (GoDaddy to victarc.com)

In GoDaddy DNS settings:

| Type | Name | Value |
|------|------|-------|
| CNAME | www | cname.vercel-dns.com |
| A | @ | 76.76.21.21 |

Then in Vercel project, Settings, Domains, add victarc.com. SSL is automatic.

---

## Rank System

| Rank | XP Required | Color |
|------|-------------|-------|
| E    | 0           | Gray  |
| D    | 500         | Green |
| C    | 1,500       | Cyan  |
| B    | 4,000       | Indigo |
| A    | 10,000      | Pink  |
| S    | 25,000      | Gold  |
| SS   | 60,000      | Orange |
| SSS  | 150,000     | Purple |

---

## Features

- XP System: Earn XP by completing challenges
- Rank System: Progress from E to SSS
- Streak Tracking: Daily completion streaks
- Global Leaderboard: Realtime via Supabase
- Boss Challenges: Special high-reward challenges
- Solo Levelling Aesthetic: Dark, glowing, animated UI
- Mobile-First: Fully responsive
- Auth: Email/password + Google OAuth
- Server Components: SSR by default

---

## License

MIT
