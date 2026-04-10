// Supabase Edge Function: send-event-reminders
//
// Invoked by a pg_cron job every minute. For each reminder whose target event
// starts in the next REMINDER_WINDOW_MINUTES and hasn't been sent yet, notifies
// the user via their enabled channels (email via Resend, Telegram via Bot API)
// and marks the reminder `sent_at = now()`.
//
// Secrets used (set via `supabase secrets set`):
//   SUPABASE_URL                 (the project URL)
//   SUPABASE_SERVICE_ROLE_KEY    (bypasses RLS, reads auth.users.email)
//   RESEND_API_KEY               (https://resend.com/api-keys)
//   RESEND_FROM                  (e.g. "Glider <events@yourdomain.com>")
//   TELEGRAM_BOT_TOKEN           (optional, enables Telegram delivery)
//
// Deploy with:
//   supabase functions deploy send-event-reminders --no-verify-jwt
//
// The `--no-verify-jwt` flag lets pg_cron call the function with the
// service_role key instead of an end-user JWT.

// deno-lint-ignore-file no-explicit-any
// @ts-ignore - Deno std import works in the edge runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

declare const Deno: {
  env: { get(key: string): string | undefined }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}

const REMINDER_WINDOW_MINUTES = 15

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

function must(name: string): string {
  const v = Deno.env.get(name)
  if (!v) throw new Error(`Missing required secret: ${name}`)
  return v
}

// ---------------------------------------------------------------------------
// Delivery helpers
// ---------------------------------------------------------------------------

async function sendTelegram(chatId: string, text: string): Promise<boolean> {
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

async function sendEmail(opts: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`Resend ${res.status}: ${body}`)
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

interface ReminderEvent {
  title: string
  starts_at: string
  link: string | null
  description: string | null
  host: string | null
  location: string | null
}

function renderEmailReminder(event: ReminderEvent): {
  subject: string
  html: string
} {
  const startsAt = new Date(event.starts_at)
  const when = startsAt.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const linkBlock = event.link
    ? `<p style="margin:16px 0;"><a href="${event.link}" style="display:inline-block;background:#5B7B3A;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Join the event</a></p>`
    : ''
  return {
    subject: `Starting soon: ${event.title}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
        <h2 style="margin:0 0 8px;">${escapeHtml(event.title)}</h2>
        <p style="margin:0 0 12px;color:#666;">${when}</p>
        ${event.description ? `<p style="line-height:1.5;">${escapeHtml(event.description)}</p>` : ''}
        ${linkBlock}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:12px;color:#999;">You're getting this because you set a reminder for this event on Glider Event Hub.</p>
      </div>
    `,
  }
}

function renderTelegramReminder(event: ReminderEvent): string {
  return [
    `\u23F0 <b>${escapeHtml(event.title)}</b> starts in ~${REMINDER_WINDOW_MINUTES} minutes.`,
    event.host ? `Hosted by ${escapeHtml(event.host)}` : '',
    event.location ? `\uD83D\uDCCD ${escapeHtml(event.location)}` : '',
    '',
    event.link ? `<a href="${event.link}">Tap to join \u2192</a>` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = must('SUPABASE_URL')
    const serviceKey = must('SUPABASE_SERVICE_ROLE_KEY')
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const resendFrom =
      Deno.env.get('RESEND_FROM') || 'Glider Event Hub <onboarding@resend.dev>'

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    // Pull unsent reminders whose target event is in the DB and starts soon.
    const { data: reminders, error: selectError } = await admin
      .from('reminders')
      .select(
        `
        user_id,
        event_id,
        sent_at,
        events!inner (
          id,
          title,
          starts_at,
          link,
          description,
          host,
          location
        )
        `,
      )
      .is('sent_at', null)
      .gte('events.starts_at', new Date().toISOString())
      .lte(
        'events.starts_at',
        new Date(Date.now() + REMINDER_WINDOW_MINUTES * 60_000).toISOString(),
      )

    if (selectError) {
      return new Response(
        JSON.stringify({ error: selectError.message }),
        { status: 500 },
      )
    }

    const rows = (reminders ?? []) as unknown as Array<{
      user_id: string
      event_id: string
      events: ReminderEvent
    }>

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, considered: 0, errors: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Collect all user IDs and fetch their delivery channels in one query
    const userIds = [...new Set(rows.map((r) => r.user_id))]
    const { data: socials } = await admin
      .from('social_connections')
      .select('user_id, platform, handle, external_id')
      .in('user_id', userIds)
      .in('platform', ['email', 'telegram'])
      .eq('notifications', true)

    // Build a map: userId -> { emailAddress?, telegramChatId? }
    const channelsByUser = new Map<
      string,
      { emailAddress?: string; telegramChatId?: string }
    >()
    for (const s of socials || []) {
      const entry = channelsByUser.get(s.user_id) || {}
      if (s.platform === 'email' && s.handle) {
        entry.emailAddress = s.handle
      } else if (s.platform === 'telegram' && s.external_id) {
        entry.telegramChatId = s.external_id
      }
      channelsByUser.set(s.user_id, entry)
    }

    let sent = 0
    const errors: string[] = []

    for (const r of rows) {
      const channels = channelsByUser.get(r.user_id)
      if (!channels || (!channels.emailAddress && !channels.telegramChatId)) {
        continue
      }

      const platforms: string[] = []
      const event = r.events
      const title = `Starting soon: ${event.title}`

      // Send email
      if (channels.emailAddress && resendKey) {
        const { subject, html } = renderEmailReminder(event)
        const ok = await sendEmail({
          apiKey: resendKey,
          from: resendFrom,
          to: channels.emailAddress,
          subject,
          html,
        })
        if (ok) {
          platforms.push('email')
        } else {
          errors.push(`email failed for user ${r.user_id}, event ${r.event_id}`)
        }
      } else if (channels.emailAddress && !resendKey) {
        console.warn('RESEND_API_KEY not set; skipping email delivery')
      }

      // Send Telegram
      if (channels.telegramChatId) {
        const telegramText = renderTelegramReminder(event)
        const ok = await sendTelegram(channels.telegramChatId, telegramText)
        if (ok) {
          platforms.push('telegram')
        } else {
          errors.push(
            `telegram failed for user ${r.user_id}, event ${r.event_id}`,
          )
        }
      }

      if (platforms.length === 0) continue

      // Log to notification_log for UI history
      const telegramBody = renderTelegramReminder(event)
      await admin.from('notification_log').insert({
        user_id: r.user_id,
        event_id: r.event_id,
        kind: 'event-soon',
        title,
        body: telegramBody,
        platforms,
      })

      // Mark as sent so the next cron tick doesn't re-send.
      const { error: updErr } = await admin
        .from('reminders')
        .update({ sent_at: new Date().toISOString() })
        .eq('user_id', r.user_id)
        .eq('event_id', r.event_id)
      if (updErr) {
        errors.push(
          `update sent_at failed for ${r.event_id}: ${updErr.message}`,
        )
      } else {
        sent++
      }
    }

    return new Response(
      JSON.stringify({ sent, considered: rows.length, errors }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e),
      }),
      { status: 500 },
    )
  }
})
