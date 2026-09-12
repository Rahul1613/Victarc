import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, tasks } = await req.json()
    
    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not set')
    }

    // Format tasks list
    const tasksList = tasks?.map((task: any) => 
      `<li style="margin: 10px 0; color: #F5F7F6;">${task.completed ? '✅' : '⬜'} ${task.text}</li>`
    ).join('') || '<li style="margin: 10px 0; color: #F5F7F6;">No tasks for today</li>'

    // Send daily reminder email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RISE Journal <noreply@risejournal.com>',
        to: email,
        subject: 'Daily Reminder - Time to Write Your Journal! 📝',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Daily Reminder</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #020B08;
                color: #F5F7F6;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #0D1916 0%, #061713 100%);
                border-radius: 20px;
                overflow: hidden;
                border: 1px solid rgba(56, 242, 160, 0.2);
              }
              .header {
                background: linear-gradient(135deg, #32E89A 0%, #1A9966 100%);
                padding: 30px;
                text-align: center;
              }
              .logo {
                font-size: 48px;
                font-weight: 800;
                letter-spacing: 0.15em;
                color: #020B08;
                margin: 0;
              }
              .content {
                padding: 30px;
                text-align: center;
              }
              .greeting {
                font-size: 24px;
                font-weight: bold;
                color: #32E89A;
                margin-bottom: 20px;
              }
              .reminder-text {
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
                color: #AAB5B1;
              }
              .tasks-section {
                background: rgba(56, 242, 160, 0.1);
                border: 2px solid rgba(56, 242, 160, 0.3);
                border-radius: 15px;
                padding: 25px;
                margin: 30px 0;
                text-align: left;
              }
              .tasks-title {
                font-size: 18px;
                font-weight: bold;
                color: #32E89A;
                margin-bottom: 15px;
                text-align: center;
              }
              .tasks-list {
                list-style: none;
                padding: 0;
                margin: 0;
              }
              .cta-button {
                display: inline-block;
                background: #32E89A;
                color: #020B08;
                padding: 15px 40px;
                border-radius: 30px;
                text-decoration: none;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #68746F;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="logo">RISE</h1>
              </div>
              
              <div class="content">
                <p class="greeting">Hello, ${name || 'Friend'}!</p>
                <p class="reminder-text">
                  It's time to write your journal entry for today. Consistency is the key to success!
                </p>
                
                <div class="tasks-section">
                  <div class="tasks-title">📋 Today's Tasks</div>
                  <ul class="tasks-list">
                    ${tasksList}
                  </ul>
                </div>
                
                <a href="https://risejournal.com/journal" class="cta-button">
                  Write Now
                </a>
              </div>
              
              <div class="footer">
                <p>RISE Journal by Victarc</p>
                <p>Consistency Creates Freedom</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
