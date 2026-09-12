# Email Setup for RISE Journal

This directory contains Supabase Edge Functions for sending emails via Resend.

## Setup Instructions

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Verify your email domain (or use Resend's default domain)

### 2. Add Environment Variable to Supabase

In your Supabase Dashboard:
1. Go to Settings → Edge Functions
2. Add environment variable: `RESEND_API_KEY`
3. Paste your Resend API key

### 3. Deploy Edge Functions

Deploy the functions to Supabase:

```bash
# From your project root
npx supabase functions deploy send-welcome-email
npx supabase functions deploy send-daily-reminder
```

### 4. Update Auth Context to Send Welcome Email

In `context/AuthContext.tsx`, add this after successful signup:

```typescript
// After successful signup
const { data } = await supabase.auth.signUp({ email, password })

if (data.user) {
  // Trigger welcome email
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-welcome-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.user.email,
      name: data.user.user_metadata.name || 'Friend',
    }),
  })
}
```

### 5. Set Up Daily Reminder Cron Job

Option 1: Use Supabase pg_cron (add to migration.sql):

```sql
-- Run daily at 9 AM UTC
SELECT cron.schedule(
  'daily-reminder-job',
  '0 9 * * *',
  $$
  SELECT 
    email,
    name,
    COALESCE(daily_reminder_time, '09:00') as reminder_time
  FROM user_settings
  JOIN users ON users.id = user_settings.user_id
  WHERE daily_reminder_enabled = true
  $$
);
```

Option 2: Use external cron service (cron-job.org, GitHub Actions, etc.)

### 6. Email Templates

The email templates include:
- **Welcome Email**: Victarc member card with user name and ID
- **Daily Reminder**: Tasks list with completion status, CTA to write journal

### 7. Test the Functions

Test welcome email:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-welcome-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

Test daily reminder:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-daily-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","tasks":[{"text":"Morning meditation","completed":false}]}'
```

## Features

- ✅ Welcome email with Victarc member card
- ✅ Daily reminder with tasks list
- ✅ Beautiful HTML email templates
- ✅ Dark forest green theme matching the app
- ✅ Responsive email design
- ✅ CTA buttons to journal

## Notes

- TypeScript errors in the function files are expected (Deno imports)
- Functions will work correctly when deployed to Supabase
- Resend free tier allows up to 3,000 emails/month
- Email domain verification may be required for production
