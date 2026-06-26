import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_SECRET || 'placeholder_secret',
})

export async function POST(req: Request) {
  try {
    const { plan, email } = await req.json()

    if (!plan || !email) {
      return NextResponse.json({ error: 'Plan and email are required parameters' }, { status: 400 })
    }

    // A-Rank = ₹49 (4900 paise), S-Rank = ₹99 (9900 paise)
    const amount = plan === 'premium' ? 9900 : 4900

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error: unknown) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create order' }, { status: 500 })
  }
}
