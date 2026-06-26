import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { requestId, screenshotUrl, expectedAmount, upiId, userName } = await req.json()

    if (!requestId || !screenshotUrl || !expectedAmount || !upiId || !userName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    if (!serviceKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not defined' }, { status: 500 })
    }

    // Create admin client to bypass RLS policies
    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceKey)

    // 2. Anti-abuse check (rate limiting: max 3 rejected requests in 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: rejectedRequests, error: countErr } = await supabaseAdmin
      .from('payment_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'rejected')
      .gt('submitted_at', oneDayAgo)

    if (countErr) {
      console.error('Error counting rejected requests:', countErr)
    }

    if (rejectedRequests && rejectedRequests.length >= 3) {
      // Flag user in database by marking this request as fraud
      await supabaseAdmin
        .from('payment_requests')
        .update({
          is_flagged_fraud: true,
          fraud_reason: 'Too many rejected screenshot verification attempts (3+ in 24h)'
        })
        .eq('id', requestId)

      return NextResponse.json({ 
        error: 'Too many failed attempts. Contact support or try after 24 hours.' 
      }, { status: 429 })
    }

    // 3. Resolve screenshot path and download file from Supabase Storage
    let screenshotPath = screenshotUrl
    if (screenshotUrl.includes('payment-proofs/')) {
      screenshotPath = screenshotUrl.split('payment-proofs/')[1].split('?')[0]
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('payment-proofs')
      .download(screenshotPath)

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError)
      return NextResponse.json({ error: 'Failed to download screenshot from storage' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const base64Image = buffer.toString('base64')
    const mimeType = fileData.type || 'image/jpeg'

    // 4. Duplicate screenshot check by hash
    const imageHash = crypto.createHash('sha256').update(buffer).digest('hex')
    const { data: duplicateHashRequests } = await supabaseAdmin
      .from('payment_requests')
      .select('id')
      .eq('screenshot_hash', imageHash)
      .eq('status', 'approved')
      .limit(1)

    if (duplicateHashRequests && duplicateHashRequests.length > 0) {
      const reason = 'Screenshot already submitted'
      await supabaseAdmin
        .from('payment_requests')
        .update({
          status: 'rejected',
          admin_note: `Auto-rejected: ${reason}`,
          reviewed_at: new Date().toISOString(),
          verified_by: 'ai',
          screenshot_hash: imageHash,
          is_flagged_fraud: true,
          fraud_reason: 'Duplicate screenshot upload detected'
        })
        .eq('id', requestId)

      // Send rejection notification
      await triggerEmailNotification({
        type: 'rejected',
        userName,
        userEmail: user.email!,
        plan: '',
        amount: expectedAmount,
        reason,
      })

      return NextResponse.json({ approved: false, rejected: true, reason })
    }

    // 5. Send screenshot to Claude vision API
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not defined' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const systemPrompt = `You are a UPI payment screenshot verification system for Victarc, a fitness app. Your job is to verify if a payment screenshot is genuine and matches expected details. Be strict but fair. Respond ONLY in JSON.`

    const userPrompt = `Analyze this UPI payment screenshot and verify:
1. Is this a real UPI payment success screenshot? (not edited, not fake, not a random image)
2. Does the amount match exactly: ₹${expectedAmount}?
3. Is the payment status SUCCESS or CREDITED?
4. Is there a valid UTR/Transaction ID visible?
5. Does receiver UPI ID contain 'victarc' or match: ${upiId}? (if visible)
6. Is the payment date within last 24 hours? (if date visible)

Signs of FAKE screenshot:
- Edited or blurred amounts
- No transaction ID
- Status says 'pending' or 'failed'
- Random image unrelated to payment
- Screenshot from browser/website instead of UPI app
- Amount doesn't match

Respond ONLY in this exact JSON format:
{
  "isReal": true,
  "amountMatches": true,
  "statusIsSuccess": true,
  "hasTransactionId": true,
  "transactionId": "extracted UTR or null",
  "receiverMatches": true,
  "confidence": 95,
  "reason": "explanation of verification decision",
  "autoApprove": true
}

Set autoApprove = true ONLY if:
isReal=true AND amountMatches=true AND statusIsSuccess=true AND hasTransactionId=true AND confidence >= 80`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: userPrompt
            }
          ]
        }
      ]
    })

    let responseText = ''
    if (response.content[0].type === 'text') {
      responseText = response.content[0].text
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const cleanJson = jsonMatch ? jsonMatch[0] : responseText
    const verification = JSON.parse(cleanJson)

    // Check UTR duplicate ID check
    if (verification.transactionId && verification.transactionId !== 'null') {
      const { data: duplicateTxn } = await supabaseAdmin
        .from('payment_requests')
        .select('id')
        .eq('ai_extracted_txn_id', verification.transactionId)
        .eq('status', 'approved')
        .limit(1)

      if (duplicateTxn && duplicateTxn.length > 0) {
        const fraudReason = 'This transaction ID was already used'
        await supabaseAdmin
          .from('payment_requests')
          .update({
            status: 'rejected',
            admin_note: `Auto-rejected: ${fraudReason}`,
            reviewed_at: new Date().toISOString(),
            verified_by: 'ai',
            ai_confidence: verification.confidence,
            ai_reason: fraudReason,
            ai_extracted_txn_id: verification.transactionId,
            screenshot_hash: imageHash,
            is_flagged_fraud: true,
            fraud_reason: 'Duplicate UTR transaction ID'
          })
          .eq('id', requestId)

        await triggerEmailNotification({
          type: 'rejected',
          userName,
          userEmail: user.email!,
          plan: '',
          amount: expectedAmount,
          reason: fraudReason,
        })

        return NextResponse.json({ approved: false, rejected: true, reason: fraudReason })
      }
    }

    // 6. Action based on autoApprove decision
    if (verification.autoApprove) {
      // Auto-approve payment
      const { error: approveError } = await supabaseAdmin.rpc('approve_payment', {
        p_request_id: requestId,
        p_admin_note: `Auto-approved by AI. Confidence: ${verification.confidence}%. UTR: ${verification.transactionId}`
      })

      if (approveError) {
        console.error('approve_payment RPC error:', approveError)
        throw approveError
      }

      await supabaseAdmin
        .from('payment_requests')
        .update({
          verified_by: 'ai',
          ai_confidence: verification.confidence,
          ai_reason: verification.reason,
          ai_extracted_txn_id: verification.transactionId || null,
          screenshot_hash: imageHash
        })
        .eq('id', requestId)

      // Fetch the plan details to send email
      const { data: reqDetails } = await supabaseAdmin
        .from('payment_requests')
        .select('plan')
        .eq('id', requestId)
        .single()

      await triggerEmailNotification({
        type: 'approved',
        userName,
        userEmail: user.email!,
        plan: reqDetails?.plan || 'Upgrade',
        amount: expectedAmount,
        txnId: verification.transactionId || 'UPI_AUTO',
      })

      return NextResponse.json({ approved: true, message: 'Auto approved' })
    } 
    
    if (verification.confidence >= 50) {
      // Flag for manual review
      await supabaseAdmin
        .from('payment_requests')
        .update({
          status: 'pending_manual',
          admin_note: `AI flagged for manual review. Reason: ${verification.reason}. Confidence: ${verification.confidence}%`,
          verified_by: 'ai_flagged',
          ai_confidence: verification.confidence,
          ai_reason: verification.reason,
          ai_extracted_txn_id: (verification.transactionId !== 'null' && verification.transactionId) || null,
          screenshot_hash: imageHash
        })
        .eq('id', requestId)

      // Fetch full request details to pass to email notifier
      const { data: dbReq } = await supabaseAdmin
        .from('payment_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      await triggerEmailNotification({
        type: 'manual_flagged',
        id: requestId,
        userName,
        userEmail: user.email!,
        plan: dbReq?.plan || '',
        amount: expectedAmount,
        upiTransactionId: dbReq?.upi_transaction_id || 'Not entered',
        screenshotUrl: dbReq?.screenshot_url || '',
        confidence: verification.confidence,
        reason: verification.reason,
      })

      return NextResponse.json({ approved: false, manualReview: true })
    } 
    
    // Otherwise, auto-reject
    await supabaseAdmin
      .from('payment_requests')
      .update({
        status: 'rejected',
        admin_note: `Auto-rejected: ${verification.reason}`,
        reviewed_at: new Date().toISOString(),
        verified_by: 'ai',
        ai_confidence: verification.confidence,
        ai_reason: verification.reason,
        ai_extracted_txn_id: (verification.transactionId !== 'null' && verification.transactionId) || null,
        screenshot_hash: imageHash
      })
      .eq('id', requestId)

    await triggerEmailNotification({
      type: 'rejected',
      userName,
      userEmail: user.email!,
      plan: '',
      amount: expectedAmount,
      reason: verification.reason,
    })

    return NextResponse.json({ approved: false, rejected: true, reason: verification.reason })

  } catch (error: unknown) {
    console.error('Error verifying screenshot:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Server error during screenshot verification' 
    }, { status: 500 })
  }
}

interface EmailPayload {
  type: 'approved' | 'rejected' | 'manual_flagged'
  id?: string
  userName: string
  userEmail: string
  plan: string
  amount: number
  txnId?: string
  upiTransactionId?: string
  screenshotUrl?: string
  reason?: string
  confidence?: number
}

// Inline helper to trigger email notification request
async function triggerEmailNotification(payload: EmailPayload) {
  try {
    const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notify-admin`
    await fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (err) {
    console.error('Failed to dispatch notification email:', err)
  }
}
