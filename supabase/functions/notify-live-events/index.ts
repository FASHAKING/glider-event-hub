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
//   * for each user that has a reminder for that event AND a connected
//     Telegram chat AND notifications enabled, sends them a Telegram DM
//   * inserts a row in notification_log so the app can show history
//   * dedupes by checking notification_log for an existing 'event-live'
//     row for the same (user, event) pair
// =====================================================================

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
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

interface LiveDispatchTask {
  userId: string
  eventId: string
  chatId: string
  title: string
  body: string
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

    // Find their Telegram connections (with notifications enabled)
    const { data: socials } = await admin
      .from('social_connections')
      .select('user_id, external_id')
      .in('user_id', userIds)
      .eq('platform', 'telegram')
      .eq('notifications', true)

    if (!socials || socials.length === 0) continue

    for (const s of socials) {
      if (!s.external_id) continue

      // Dedupe – has this user already received an event-live ping for
      // this event?
      const { data: existing } = await admin
        .from('notification_log')
        .select('id')
        .eq('user_id', s.user_id)
        .eq('event_id', event.id)
        .eq('kind', 'event-live')
        .limit(1)
        .maybeSingle()
      if (existing) continue

      tasks.push({
        userId: s.user_id,
        eventId: event.id,
        chatId: s.external_id,
        title: `${event.title} is LIVE`,
        body: [
          `🟢 <b>${escapeHtml(event.title)}</b> just went live.`,
          event.host ? `Hosted by ${escapeHtml(event.host)}` : '',
          event.location ? `📍 ${escapeHtml(event.location)}` : '',
          '',
          `<a href="${event.link}">Tap to join →</a>`,
        ]
          .filter(Boolean)
          .join('\n'),
      })
    }
  }

  let sent = 0
  for (const task of tasks) {
    const ok = await sendTelegram(task.chatId, task.body)
    if (!ok) continue
    await admin.from('notification_log').insert({
      user_id: task.userId,
      event_id: task.eventId,
      kind: 'event-live',
      title: task.title,
      body: task.body,
      platforms: ['telegram'],
    })
    sent++
  }

  return new Response(
    JSON.stringify({ checked: liveEvents?.length || 0, sent }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
