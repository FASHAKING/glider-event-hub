// =====================================================================
// Glider Event Hub – Live Event Notifier
// =====================================================================
//
// Deploy:
//   supabase functions deploy notify-live-events
//
// Schedule it via the Supabase dashboard (Edge Functions → Schedules)
// to run every minute, OR call it from pg_cron with:
//
//   select cron.schedule(
//     'notify-live-events',
//     '* * * * *',
//     $$
//       select net.http_post(
//         url := 'https://<project-ref>.functions.supabase.co/notify-live-events',
//         headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret'))
//       );
//     $$
//   );
//
// What it does:
//   * looks at events that have started in the last 2 minutes
//     (status: just-went-live)
//   * for each user that has a reminder for that event AND at least
//     one delivery channel (Telegram and/or email) with notifications
//     enabled, sends the appropriate message on every channel
//   * inserts a row in notification_log so the app can show history
//   * dedupes by checking notification_log for an existing 'event-live'
//     row for the same (user, event) pair
//
// Required secrets (set via `supabase secrets set`):
//   SUPABASE_URL                 – auto-injected by the runtime
//   SUPABASE_SERVICE_ROLE_KEY    – auto-injected by the runtime
//   TELEGRAM_BOT_TOKEN           – optional, enables Telegram delivery
//   RESEND_API_KEY               – optional, enables email delivery
//   RESEND_FROM                  – optional, defaults to
//                                  'Glider Event Hub <onboarding@resend.dev>'
// =====================================================================

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM =
  Deno.env.get('RESEND_FROM') || 'Glider Event Hub <onboarding@resend.dev>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function sendTelegram(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set; skipping Telegram delivery')
    return false
  }
  const r = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    },
  )
  if (!r.ok) {
    console.error('telegram send failed', await r.text())
    return false
  }
  return true
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set; skipping email delivery')
    return false
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  })
  if (!r.ok) {
    console.error('resend send failed', await r.text())
    return false
  }
  return true
}

interface LiveDispatchTask {
  userId: string
  eventId: string
  title: string
  /** Telegram HTML body (only set if telegram channel is active) */
  telegramBody?: string
  telegramChatId?: string
  /** Email HTML body (only set if email channel is active) */
  emailBody?: string
  emailAddress?: string
}

Deno.serve(async () => {
  const now = new Date()
  const justNow = new Date(now.getTime() - 2 * 60_000)

  // 1. Find events that just went live (started in the last 2 minutes
  //    and are still within their duration window).
  const { data: liveEvents, error: eventsErr } = await admin
    .from('events')
    .select('*')
    .gte('starts_at', justNow.toISOString())
    .lte('starts_at', now.toISOString())

  if (eventsErr) {
    console.error('events fetch failed', eventsErr)
    return new Response('events fetch failed', { status: 500 })
  }

  const tasks: LiveDispatchTask[] = []

  for (const event of liveEvents || []) {
    // Find users who reminded this event
    const { data: reminders } = await admin
      .from('reminders')
      .select('user_id')
      .eq('event_id', event.id)
    if (!reminders || reminders.length === 0) continue

    const userIds = reminders.map((r) => r.user_id)

    // Find every delivery channel (telegram + email) enabled for those users
    const { data: socials } = await admin
      .from('social_connections')
      .select('user_id, platform, handle, external_id')
      .in('user_id', userIds)
      .in('platform', ['telegram', 'email'])
      .eq('notifications', true)

    if (!socials || socials.length === 0) continue

    // Group by user so we can send one dedupe-safe task per user.
    const byUser = new Map<
      string,
      {
        telegramChatId?: string
        emailAddress?: string
      }
    >()
    for (const s of socials) {
      const entry = byUser.get(s.user_id) || {}
      if (s.platform === 'telegram' && s.external_id) {
        entry.telegramChatId = s.external_id
      } else if (s.platform === 'email' && s.handle) {
        entry.emailAddress = s.handle
      }
      byUser.set(s.user_id, entry)
    }

    for (const [userId, channels] of byUser) {
      if (!channels.telegramChatId && !channels.emailAddress) continue

      // Dedupe – has this user already received an event-live ping for
      // this event?
      const { data: existing } = await admin
        .from('notification_log')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', event.id)
        .eq('kind', 'event-live')
        .limit(1)
        .maybeSingle()
      if (existing) continue

      const title = `${event.title} is LIVE`
      const telegramBody = [
        `🟢 <b>${escapeHtml(event.title)}</b> just went live.`,
        event.host ? `Hosted by ${escapeHtml(event.host)}` : '',
        event.location ? `📍 ${escapeHtml(event.location)}` : '',
        '',
        `<a href="${event.link}">Tap to join →</a>`,
      ]
        .filter(Boolean)
        .join('\n')

      const emailBody = renderEmail(event)

      tasks.push({
        userId,
        eventId: event.id,
        title,
        telegramChatId: channels.telegramChatId,
        telegramBody: channels.telegramChatId ? telegramBody : undefined,
        emailAddress: channels.emailAddress,
        emailBody: channels.emailAddress ? emailBody : undefined,
      })
    }
  }

  let sent = 0
  for (const task of tasks) {
    const platforms: string[] = []

    if (task.telegramChatId && task.telegramBody) {
      const ok = await sendTelegram(task.telegramChatId, task.telegramBody)
      if (ok) platforms.push('telegram')
    }
    if (task.emailAddress && task.emailBody) {
      const ok = await sendEmail(task.emailAddress, task.title, task.emailBody)
      if (ok) platforms.push('email')
    }
    if (platforms.length === 0) continue

    await admin.from('notification_log').insert({
      user_id: task.userId,
      event_id: task.eventId,
      kind: 'event-live',
      title: task.title,
      body: task.telegramBody || stripHtml(task.emailBody || ''),
      platforms,
    })
    sent++
  }

  return new Response(
    JSON.stringify({ checked: liveEvents?.length || 0, sent }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})

function renderEmail(event: any): string {
  const title = escapeHtml(event.title || '')
  const host = escapeHtml(event.host || '')
  const location = escapeHtml(event.location || '')
  const description = escapeHtml(event.description || '').replace(
    /\n/g,
    '<br/>',
  )
  const link = event.link || '#'
  const image = event.image_url
    ? `<img src="${event.image_url}" alt="" style="max-width:100%;border-radius:12px;margin-bottom:20px" />`
    : ''
  return `
  <!doctype html>
  <html>
    <body style="margin:0;padding:0;background:#f7f6f1;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a">
      <div style="max-width:560px;margin:0 auto;padding:32px 20px">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#6b7a56;margin-bottom:8px">Glider Event Hub</div>
        <h1 style="font-size:28px;line-height:1.2;margin:0 0 8px 0">🟢 ${title} is live</h1>
        <p style="color:#545b43;margin:0 0 24px 0">An event you're tracking just went live. Jump in now.</p>
        ${image}
        <div style="background:#ffffff;border:1px solid #e5e3d8;border-radius:16px;padding:20px;margin-bottom:20px">
          ${host ? `<div style="font-size:13px;color:#6b7a56;margin-bottom:4px">Hosted by</div><div style="font-weight:600;margin-bottom:12px">${host}</div>` : ''}
          ${location ? `<div style="font-size:13px;color:#6b7a56;margin-bottom:4px">Location</div><div style="font-weight:600;margin-bottom:12px">${location}</div>` : ''}
          ${description ? `<div style="font-size:13px;color:#6b7a56;margin-bottom:4px">About</div><div style="color:#1a1a1a">${description}</div>` : ''}
        </div>
        <a href="${link}" style="display:inline-block;background:#6b7a56;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:600">Join the event →</a>
        <p style="color:#8d8f84;font-size:12px;margin-top:32px">
          You're getting this because you set a reminder on Glider Event Hub.
          You can turn off email notifications from your profile → Connected Socials.
        </p>
      </div>
    </body>
  </html>`
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
