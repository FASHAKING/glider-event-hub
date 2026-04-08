// =====================================================================
// Glider Event Hub – Telegram Bot Webhook
// =====================================================================
//
// Deploy:
//   supabase functions deploy telegram-webhook --no-verify-jwt
//
// Set secrets (run once):
//   supabase secrets set TELEGRAM_BOT_TOKEN=123456:ABC...
//   supabase secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 16)
//
// Then point Telegram at this function:
//   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
//     -d "url=https://<project-ref>.functions.supabase.co/telegram-webhook" \
//     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
//
// What it does:
//   * receives every Telegram update for the Glider bot
//   * if a user types `/start <CODE>`, it looks up the matching
//     telegram_link_codes row, finds the associated user, upserts a
//     social_connections row with platform=telegram, handle=<username>
//     and external_id=<chat_id>, then deletes the link code.
//   * confirms back to the user in chat that the link succeeded.
// =====================================================================

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function sendMessage(chatId: number | string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    },
  )
}

Deno.serve(async (req) => {
  // Telegram lets us require a secret header so randos can't hit the URL
  if (TELEGRAM_WEBHOOK_SECRET) {
    const got = req.headers.get('x-telegram-bot-api-secret-token')
    if (got !== TELEGRAM_WEBHOOK_SECRET) {
      return new Response('forbidden', { status: 403 })
    }
  }

  let update: any
  try {
    update = await req.json()
  } catch {
    return new Response('bad json', { status: 400 })
  }

  const message = update.message || update.edited_message
  if (!message || !message.text) {
    return new Response('ok')
  }

  const chatId = message.chat.id
  const username = message.from?.username || message.from?.first_name || 'user'
  const text: string = message.text.trim()

  // Handle /start <code> for account linking
  if (text.startsWith('/start')) {
    const parts = text.split(/\s+/)
    const code = parts[1]
    if (!code) {
      await sendMessage(
        chatId,
        'Welcome to <b>Glider Event Hub</b>! Open the app, sign in, and tap <i>Connect Telegram</i> in your profile to receive event pings here.',
      )
      return new Response('ok')
    }

    const { data: linkRow, error: linkErr } = await admin
      .from('telegram_link_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (linkErr || !linkRow) {
      await sendMessage(
        chatId,
        '❌ That link code is invalid or has already been used. Generate a new one in the app and try again.',
      )
      return new Response('ok')
    }

    if (new Date(linkRow.expires_at).getTime() < Date.now()) {
      await admin.from('telegram_link_codes').delete().eq('code', code)
      await sendMessage(
        chatId,
        '⏱ That link code has expired. Generate a new one in the app and try again.',
      )
      return new Response('ok')
    }

    // upsert the social connection row
    await admin.from('social_connections').upsert({
      user_id: linkRow.user_id,
      platform: 'telegram',
      handle: username,
      external_id: String(chatId),
      notifications: true,
      connected_at: new Date().toISOString(),
    })

    // burn the code
    await admin.from('telegram_link_codes').delete().eq('code', code)

    await sendMessage(
      chatId,
      '✅ <b>Linked!</b> You\'ll get a ping here whenever an event you\'re tracking goes live.',
    )
    return new Response('ok')
  }

  // Generic help / unknown command
  if (text === '/help' || text === '/about') {
    await sendMessage(
      chatId,
      'Commands:\n<code>/start CODE</code> – link your Glider account\n<code>/help</code> – show this',
    )
    return new Response('ok')
  }

  return new Response('ok')
})
