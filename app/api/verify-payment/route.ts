import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan, supabase_user_id } = await req.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !plan || !supabase_user_id) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 })
    }

    // Verify signature using Razorpay secret
    const secret = process.env.RAZORPAY_SECRET || 'placeholder_secret'
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id)
    const generatedSignature = hmac.digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Signature verification failed' }, { status: 400 })
    }

    // Instantiate Supabase Admin using service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY environment variable is not defined. Using public keys as fallback.')
    }

    // Connect to Supabase with admin privileges to bypass RLS policies
    const supabaseAdmin = createClient(
      supabaseUrl, 
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Update user profile plan status
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        plan,
        payment_id: razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq('id', supabase_user_id)

    if (error) {
      console.error('Database update failed:', error)
      return NextResponse.json({ success: false, error: 'Failed to update database profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Verification exception occurred' }, { status: 500 })
  }
}
