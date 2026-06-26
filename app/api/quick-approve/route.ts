import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// In-memory rate limiting map
const IP_LIMIT = 10
const WINDOW_MS = 60 * 1000 // 1 minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return false
  }
  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return false
  }
  record.count++
  return record.count > IP_LIMIT
}

// Styled HTML helper to output status pages
function renderHtmlPage({
  title,
  icon,
  message,
  color,
  shadowColor,
  details = []
}: {
  title: string
  icon: string
  message: string
  color: string
  shadowColor: string
  details?: { label: string; value: string }[]
}) {
  const detailsHtml = details
    .map(d => `<div class="detail"><strong>${d.label}:</strong> ${d.value}</div>`)
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Victarc Admin — Quick Action</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          background: #08080f; 
          color: #ffffff; 
          font-family: 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .card {
          background: #0f0f18;
          border: 2px solid ${color};
          border-radius: 16px;
          padding: 40px 30px;
          text-align: center;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 0 35px ${shadowColor};
          box-sizing: border-box;
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        .title { 
          font-size: 22px; 
          font-weight: 800;
          color: ${color};
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .message {
          font-size: 15px;
          color: #d1d5db;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .details-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: left;
        }
        .detail { 
          color: #9ca3af; 
          font-size: 14px; 
          margin: 6px 0; 
          word-break: break-all;
        }
        .detail strong {
          color: #e5e7eb;
        }
        .badge {
          background: ${color}1a;
          border: 1px solid ${color};
          color: ${color};
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: inline-block;
        }
        a.dashboard-btn {
          display: block;
          margin-top: 20px;
          color: #a78bfa;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }
        a.dashboard-btn:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${icon}</div>
        <div class="title">${title}</div>
        <div class="message">${message}</div>
        ${details.length > 0 ? `<div class="details-box">${detailsHtml}</div>` : ''}
        <div class="badge">⚔️ Hunter Realm</div>
        <a class="dashboard-btn" href="/admin">Go to Admin Dashboard</a>
      </div>
    </body>
    </html>
  `
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  if (isRateLimited(ip)) {
    return new NextResponse(
      renderHtmlPage({
        title: 'Rate Limit Exceeded',
        icon: '⚠️',
        message: 'Too many requests. Please wait a moment before trying again.',
        color: '#fbbf24',
        shadowColor: 'rgba(251, 191, 36, 0.2)'
      }),
      { status: 429, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('requestId')
  const adminKey = searchParams.get('adminKey')
  const action = searchParams.get('action')

  // Step 1: Verify admin key
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return new NextResponse(
      renderHtmlPage({
        title: 'Unauthorized',
        icon: '❌',
        message: 'Invalid admin secret key. Access denied.',
        color: '#ef4444',
        shadowColor: 'rgba(239, 68, 68, 0.2)'
      }),
      { status: 401, headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (!requestId || !action || !['approve', 'reject'].includes(action)) {
    return new NextResponse(
      renderHtmlPage({
        title: 'Bad Request',
        icon: '❓',
        message: 'Missing or invalid request parameters.',
        color: '#fbbf24',
        shadowColor: 'rgba(251, 191, 36, 0.2)'
      }),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // Initialize Supabase Admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return new NextResponse(
      renderHtmlPage({
        title: 'Configuration Error',
        icon: '⚙️',
        message: 'Supabase service role key is not defined on the server.',
        color: '#ef4444',
        shadowColor: 'rgba(239, 68, 68, 0.2)'
      }),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
  const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceKey)

  try {
    // Step 2: Fetch request from database
    const { data: reqData, error: fetchError } = await supabaseAdmin
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !reqData) {
      return new NextResponse(
        renderHtmlPage({
          title: 'Request Not Found',
          icon: '🔍',
          message: 'The requested payment verification record does not exist.',
          color: '#ef4444',
          shadowColor: 'rgba(239, 68, 68, 0.2)'
        }),
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Step 5: Expiration check (48 hours limit)
    const submittedAt = new Date(reqData.submitted_at)
    const now = new Date()
    const diffHours = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60)
    if (diffHours > 48) {
      return new NextResponse(
        renderHtmlPage({
          title: 'Link Expired',
          icon: '⏰',
          message: 'This one-click link has expired (48-hour window exceeded). Please log in to the admin panel to resolve manually.',
          color: '#fbbf24',
          shadowColor: 'rgba(251, 191, 36, 0.2)'
        }),
        { status: 410, headers: { 'Content-Type': 'text/html' } }
      )
    }

    // One-time use check
    if (reqData.status === 'approved') {
      return new NextResponse(
        renderHtmlPage({
          title: 'Already Processed',
          icon: '✅',
          message: 'This payment request has already been approved.',
          color: '#22c55e',
          shadowColor: 'rgba(34, 197, 94, 0.2)',
          details: [
            { label: 'Hunter', value: reqData.user_name },
            { label: 'Email', value: reqData.user_email },
            { label: 'Plan', value: reqData.plan },
            { label: 'Amount', value: `₹${reqData.amount}` }
          ]
        }),
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    if (reqData.status === 'rejected') {
      return new NextResponse(
        renderHtmlPage({
          title: 'Already Processed',
          icon: '❌',
          message: 'This payment request has already been rejected.',
          color: '#ef4444',
          shadowColor: 'rgba(239, 68, 68, 0.2)',
          details: [
            { label: 'Hunter', value: reqData.user_name },
            { label: 'Email', value: reqData.user_email },
            { label: 'Plan', value: reqData.plan },
            { label: 'Amount', value: `₹${reqData.amount}` }
          ]
        }),
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const istTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium'
    }) + ' (IST)'

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (action === 'approve') {
      // Step 3: Approve payment
      const { error: approveError } = await supabaseAdmin.rpc('approve_payment', {
        p_request_id: requestId,
        p_admin_note: 'Approved via quick email link'
      })

      if (approveError) throw approveError

      // Update metadata fields
      const { error: updateError } = await supabaseAdmin
        .from('payment_requests')
        .update({
          verified_by: 'manual',
          reviewed_at: new Date().toISOString(),
          admin_note: 'Approved via quick email link'
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Log action in admin_actions table
      await supabaseAdmin.from('admin_actions').insert({
        action: 'approve',
        request_id: requestId,
        performed_via: 'email_link'
      })

      // Send approval confirmation email to user via notify-admin API
      try {
        const notifyUrl = `${siteUrl}/api/notify-admin`
        await fetch(notifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'approved',
            userName: reqData.user_name,
            userEmail: reqData.user_email,
            plan: reqData.plan,
            amount: reqData.amount,
            txnId: reqData.upi_transaction_id || 'UPI_MANUAL',
          })
        })
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr)
      }

      return new NextResponse(
        renderHtmlPage({
          title: 'Payment Approved',
          icon: '✅',
          message: 'The payment has been successfully approved and access has been unlocked.',
          color: '#22c55e',
          shadowColor: 'rgba(34, 197, 94, 0.2)',
          details: [
            { label: 'Hunter', value: reqData.user_name },
            { label: 'Email', value: reqData.user_email },
            { label: 'Plan', value: reqData.plan },
            { label: 'Amount', value: `₹${reqData.amount}` },
            { label: 'Processed At', value: istTime }
          ]
        }),
        { headers: { 'Content-Type': 'text/html' } }
      )
    } else {
      // Step 4: Reject payment
      const { error: rejectError } = await supabaseAdmin.rpc('reject_payment', {
        p_request_id: requestId,
        p_admin_note: 'Rejected via quick email link'
      })

      if (rejectError) throw rejectError

      // Update metadata fields
      const { error: updateError } = await supabaseAdmin
        .from('payment_requests')
        .update({
          verified_by: 'manual',
          reviewed_at: new Date().toISOString(),
          admin_note: 'Rejected via quick email link'
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Log action in admin_actions table
      await supabaseAdmin.from('admin_actions').insert({
        action: 'reject',
        request_id: requestId,
        performed_via: 'email_link'
      })

      // Send rejection confirmation email to user via notify-admin API
      try {
        const notifyUrl = `${siteUrl}/api/notify-admin`
        await fetch(notifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rejected',
            userName: reqData.user_name,
            userEmail: reqData.user_email,
            plan: reqData.plan,
            amount: reqData.amount,
            reason: 'Rejected via quick email link',
          })
        })
      } catch (emailErr) {
        console.error('Failed to send rejection email:', emailErr)
      }

      return new NextResponse(
        renderHtmlPage({
          title: 'Payment Rejected',
          icon: '❌',
          message: 'The payment has been rejected and the user has been notified.',
          color: '#ef4444',
          shadowColor: 'rgba(239, 68, 68, 0.2)',
          details: [
            { label: 'Hunter', value: reqData.user_name },
            { label: 'Email', value: reqData.user_email },
            { label: 'Plan', value: reqData.plan },
            { label: 'Amount', value: `₹${reqData.amount}` },
            { label: 'Processed At', value: istTime }
          ]
        }),
        { headers: { 'Content-Type': 'text/html' } }
      )
    }
  } catch (error: unknown) {
    console.error('Error in quick-approve endpoint:', error)
    const errorMsg = error instanceof Error ? error.message : 'Server error during quick action approval'
    return new NextResponse(
      renderHtmlPage({
        title: 'Server Error',
        icon: '🚨',
        message: `An unexpected server error occurred: ${errorMsg}`,
        color: '#ef4444',
        shadowColor: 'rgba(239, 68, 68, 0.2)'
      }),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
}
