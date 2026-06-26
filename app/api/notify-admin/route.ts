import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { 
      type, 
      id, 
      userName, 
      userEmail, 
      plan, 
      amount, 
      txnId, 
      upiTransactionId, 
      reason, 
      confidence, 
      screenshotUrl 
    } = payload

    const gmailUser = process.env.GMAIL_USER
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'YOUR_EMAIL@gmail.com'

    if (!gmailUser || !gmailAppPassword) {
      console.warn('GMAIL_USER or GMAIL_APP_PASSWORD is not defined in environment variables. Email dispatch skipped.')
      return NextResponse.json({ success: false, error: 'Email configuration missing' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })

    let mailOptions: nodemailer.SendMailOptions

    if (type === 'approved') {
      const planLabel = plan === 'premium' ? 'S-Rank Hunter (Lifetime)' : plan === 'basic' ? 'A-Rank Hunter (Lifetime)' : `${plan} package`
      mailOptions = {
        from: `"The Shadow Monarch" <${gmailUser}>`,
        to: userEmail,
        subject: '⚔️ ACCESS GRANTED — Welcome to Shadow Army, Hunter!',
        html: `
          <div style="background-color: #08080f; color: #ffffff; font-family: 'Exo 2', sans-serif; padding: 25px; border: 1px solid #7c3aed; border-radius: 8px; max-width: 600px; margin: auto;">
            <h1 style="color: #7c3aed; text-transform: uppercase; letter-spacing: 2px; text-align: center;">Access Unlocked</h1>
            <p>Hey <strong>${userName}</strong>!</p>
            <p>Your payment of <strong>₹${amount}</strong> has been automatically verified. ⚡</p>
            
            <div style="background-color: rgba(255,255,255,0.05); padding: 15px; border-left: 4px solid #06b6d4; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0;"><strong>Plan / Reward:</strong> ${planLabel}</p>
              <p style="margin: 5px 0;"><strong>Transaction/UTR ID:</strong> ${txnId}</p>
              <p style="margin: 5px 0;"><strong>Verification Method:</strong> Victarc AI Verification Engine</p>
            </div>
            
            <p>Your access is now active. Log in and enter the Shadow Realm:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://victarc.in'}/dashboard" style="background: linear-gradient(135deg, #7c3aed, #2563eb); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; box-shadow: 0 0 15px rgba(124,58,237,0.4);">Arise & Enter</a>
            </div>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 12px; color: #888888; text-align: center;">— The Shadow Monarch</p>
          </div>
        `,
      }
    } else if (type === 'rejected') {
      mailOptions = {
        from: `"Victarc Support" <${gmailUser}>`,
        to: userEmail,
        subject: '⚠️ Payment Verification Failed — Victarc',
        html: `
          <div style="background-color: #08080f; color: #ffffff; font-family: 'Exo 2', sans-serif; padding: 25px; border: 1px solid #ef4444; border-radius: 8px; max-width: 600px; margin: auto;">
            <h1 style="color: #ef4444; text-transform: uppercase; letter-spacing: 2px; text-align: center;">Verification Failed</h1>
            <p>Hey <strong>${userName}</strong>,</p>
            <p>We couldn't verify your payment screenshot for Victarc access.</p>
            
            <div style="background-color: rgba(239,68,68,0.1); padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px; color: #fca5a5;">
              <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>
            </div>
            
            <p>Please ensure your screenshot clearly shows:</p>
            <ul style="line-height: 1.6; color: #d1d5db;">
              <li>Payment <strong>SUCCESS</strong> status (e.g. Done, Completed, Success)</li>
              <li>Correct amount (<strong>₹${amount}</strong>)</li>
              <li>Visible 12-digit <strong>UTR / Transaction ID number</strong></li>
              <li>Full screen layout from your UPI app (GPay, PhonePe, Paytm, etc.)</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://victarc.in'}/dashboard" style="background: #1f2937; border: 1px solid rgba(255,255,255,0.15); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Try Again</a>
            </div>
            
            <p style="font-size: 13px; color: #9ca3af; text-align: center;">If you believe this was an error, please reply directly to this email with your transaction details.</p>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 12px; color: #888888; text-align: center;">— Victarc Support Team</p>
          </div>
        `,
      }
    } else if (type === 'manual_flagged') {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://victarc.in'
      const adminSecret = process.env.ADMIN_SECRET_KEY || 'victarc_admin_2024_secret_random_string'

      const istTimestamp = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium'
      }) + ' (IST)'

      // Fetch screenshot from storage if url is available
      let attachmentsList: nodemailer.SendMailOptions['attachments'] = []

      if (screenshotUrl) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceKey) {
          const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceKey)
          let screenshotPath = screenshotUrl
          if (screenshotUrl.includes('payment-proofs/')) {
            screenshotPath = screenshotUrl.split('payment-proofs/')[1].split('?')[0]
          }

          const { data: fileData, error: downloadError } = await supabaseAdmin
            .storage
            .from('payment-proofs')
            .download(screenshotPath)

          if (!downloadError && fileData) {
            const buffer = Buffer.from(await fileData.arrayBuffer())
            attachmentsList = [{
              filename: 'payment_proof.jpg',
              content: buffer,
              contentType: 'image/jpeg'
            }]
          } else {
            console.error('Failed to download payment proof for email attachment:', downloadError)
          }
        }
      }

      const planLabel = plan === 'premium' ? 'S-Rank Hunter (Lifetime)' : plan === 'basic' ? 'A-Rank Hunter (Lifetime)' : plan

      mailOptions = {
        from: `"Victarc System Alerts" <${gmailUser}>`,
        to: adminEmail,
        subject: `⚔️ NEW PAYMENT — ${userName} — ₹${amount} — ${planLabel}`,
        attachments: attachmentsList,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="background:#0a0a0a; color:white; font-family:sans-serif; padding:20px; margin:0;">
            <div style="max-width:500px; margin:0 auto; background:#111; border:2px solid #6c63ff; border-radius:16px; padding:32px; box-shadow: 0 0 20px #6c63ff44; box-sizing:border-box;">
              <h1 style="color:#6c63ff; font-size:20px; margin:0 0 24px; text-transform:uppercase; letter-spacing:1px; text-align:center;">
                ⚔️ NEW PAYMENT REQUEST
              </h1>

              <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:16px; border-radius:8px; margin-bottom:24px;">
                <p style="color:#eab308; font-size:14px; font-weight:bold; margin:0 0 10px;">⚠️ AI Flagged For Review (Confidence: ${confidence}%)</p>
                <p style="color:#9ca3af; font-size:13px; font-style:italic; margin:0;">Reason: ${reason}</p>
              </div>

              <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
                <tr>
                  <td style="color:#888; padding:8px 0; font-size:13px; border-bottom: 1px solid #222;">Hunter Name</td>
                  <td style="color:white; font-weight:bold; padding:8px 0; border-bottom: 1px solid #222; text-align:right;">${userName}</td>
                </tr>
                <tr>
                  <td style="color:#888; padding:8px 0; font-size:13px; border-bottom: 1px solid #222;">Email</td>
                  <td style="color:white; padding:8px 0; border-bottom: 1px solid #222; text-align:right; word-break:break-all;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="color:#888; padding:8px 0; font-size:13px; border-bottom: 1px solid #222;">Plan</td>
                  <td style="color:#a78bfa; font-weight:bold; padding:8px 0; border-bottom: 1px solid #222; text-align:right;">${planLabel} — ₹${amount}</td>
                </tr>
                <tr>
                  <td style="color:#888; padding:8px 0; font-size:13px; border-bottom: 1px solid #222;">UPI Transaction ID</td>
                  <td style="color:white; padding:8px 0; border-bottom: 1px solid #222; text-align:right;">${upiTransactionId || 'Not entered'}</td>
                </tr>
                <tr>
                  <td style="color:#888; padding:8px 0; font-size:13px; border-bottom: 1px solid #222;">Submitted At</td>
                  <td style="color:white; padding:8px 0; border-bottom: 1px solid #222; text-align:right;">${istTimestamp}</td>
                </tr>
              </table>

              <p style="color:#d1d5db; font-size:14px; margin-bottom: 20px; line-height: 1.4; text-align: center;">
                📱 On mobile: Tap green APPROVE button below.<br>
                Screenshot attached — swipe down to see it.
              </p>

              <div style="margin-top:32px; text-align:center;">
                <div style="font-weight:bold; font-size:13px; color:#888; margin-bottom:12px; text-transform:uppercase; letter-spacing:1px;">
                  ONE CLICK APPROVE
                </div>
                <a href="${siteUrl}/api/quick-approve?requestId=${id}&adminKey=${adminSecret}&action=approve"
                  style="display:block; margin:12px 0; background:#22c55e; color:white; padding:0 24px; border-radius:12px; text-decoration:none; font-weight:bold; font-size:18px; text-align:center; min-height:56px; line-height:56px; box-sizing:border-box;">
                  ✅ APPROVE PAYMENT
                </a>

                <a href="${siteUrl}/api/quick-approve?requestId=${id}&adminKey=${adminSecret}&action=reject"
                  style="display:block; margin:12px 0; background:#ef4444; color:white; padding:0 24px; border-radius:12px; text-decoration:none; font-weight:bold; font-size:16px; text-align:center; min-height:56px; line-height:56px; box-sizing:border-box;">
                  ❌ REJECT PAYMENT
                </a>

                <a href="${siteUrl}/admin"
                  style="display:block; margin:24px 0 12px; background:#333; color:#bbb; padding:12px 24px; border-radius:12px; text-decoration:none; font-size:14px; font-weight:600; text-align:center;">
                  📊 Open Full Admin Dashboard
                </a>
              </div>

              <p style="color:#555; font-size:11px; margin-top:32px; text-align:center; line-height: 1.4;">
                Victarc Admin System · victarc.in · <br>
                Do not share this email — contains secure quick action links.
              </p>
            </div>
          </body>
          </html>
        `,
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unknown email notification type' }, { status: 400 })
    }

    await transporter.sendMail(mailOptions)
    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('Error sending email notification:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Server error during email dispatch' 
    }, { status: 500 })
  }
}
