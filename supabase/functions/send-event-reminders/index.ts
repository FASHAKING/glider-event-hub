// Supabase Edge Function: send-event-reminders
//
// Invoked by a pg_cron job every minute. For each reminder whose target event
// starts in the next REMINDER_WINDOW_MINUTES and hasn't been sent yet, emails
// the user via Resend and marks the reminder `sent_at = now()`.
//
// Secrets used (set via `supabase secrets set`):
//   SUPABASE_URL                 (the project URL)
//   SUPABASE_SERVICE_ROLE_KEY    (bypasses RLS, reads auth.users.email)
//   RESEND_API_KEY               (https://resend.com/api-keys)
//   RESEND_FROM                  (e.g. "Glider <events@yourdomain.com>")
//
// Deploy with:
//   supabase functions deploy send-event-reminders --no-verify-jwt
//
// The `--no-verify-jwt` flag lets pg_cron call the function with the
// service_role key instead of an end-user JWT.

// @ts-ignore - Deno std import works in the edge runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

declare const Deno: {
  env: { get(key: string): string | undefined }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}

const REMINDER_WINDOW_MINUTES = 15

interface ReminderRow {
  user_id: string
  event_id: string
  event_title: string
  event_starts_at: string
  event_link: string | null
  event_description: string | null
  user_email: string | null
}

function must(name: string): string {
  const v = Deno.env.get(name)
  if (!v) throw new Error(`Missing required secret: ${name}`)
  return v
}

async function sendEmail(opts: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
}): Promise<void> {
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
    throw new Error(`Resend ${res.status}: ${body}`)
  }
}

function renderEmail(row: ReminderRow): { subject: string; html: string } {
  const startsAt = new Date(row.event_starts_at)
  const when = startsAt.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const linkBlock = row.event_link
    ? `<p style="margin:16px 0;"><a href="${row.event_link}" style="display:inline-block;background:#5B7B3A;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Join the event</a></p>`
    : ''
  return {
    subject: `Starting soon: ${row.event_title}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
        <h2 style="margin:0 0 8px;">${row.event_title}</h2>
        <p style="margin:0 0 12px;color:#666;">${when}</p>
        ${row.event_description ? `<p style="line-height:1.5;">${row.event_description}</p>` : ''}
        ${linkBlock}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:12px;color:#999;">You're getting this because you set a reminder for this event on Glider Event Hub.</p>
      </div>
    `,
  }
}

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = must('SUPABASE_URL')
    const serviceKey = must('SUPABASE_SERVICE_ROLE_KEY')
    const resendKey = must('RESEND_API_KEY')
    const resendFrom = must('RESEND_FROM')

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    // Pull unsent reminders whose target event is in the DB and starts soon.
    // We do the join in SQL via an RPC-style select to avoid N+1 round trips.
    const { data: reminders, error: selectError } = await admin
      .from('event_reminders')
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
          description
        )
        `,
      )
      .is('sent_at', null)
      .gte('events.starts_at', new Date().toISOString())
      .lte(
        'events.starts_at',
        new Date(Date.now() + REMINDER_WINDOW_MINUTES * 60_000).toISOString(),
      )
      .filter('event_id', 'eq', 'events.id')

    if (selectError) {
      return new Response(
        JSON.stringify({ error: selectError.message }),
        { status: 500 },
      )
    }

    const rows = (reminders ?? []) as unknown as Array<{
      user_id: string
      event_id: string
      events: {
        title: string
        starts_at: string
        link: string | null
        description: string | null
      }
    }>

    let sent = 0
    const errors: string[] = []

    for (const r of rows) {
      // Look up the user's email. Admin API, bypasses RLS.
      const { data: userData, error: userErr } =
        await admin.auth.admin.getUserById(r.user_id)
      if (userErr || !userData?.user?.email) {
        errors.push(`no email for ${r.user_id}: ${userErr?.message ?? 'n/a'}`)
        continue
      }

      const payload: ReminderRow = {
        user_id: r.user_id,
        event_id: r.event_id,
        event_title: r.events.title,
        event_starts_at: r.events.starts_at,
        event_link: r.events.link,
        event_description: r.events.description,
        user_email: userData.user.email,
      }

      try {
        const { subject, html } = renderEmail(payload)
        await sendEmail({
          apiKey: resendKey,
          from: resendFrom,
          to: userData.user.email,
          subject,
          html,
        })

        // Mark as sent so the next cron tick doesn't re-send.
        const { error: updErr } = await admin
          .from('event_reminders')
          .update({ sent_at: new Date().toISOString() })
          .eq('user_id', r.user_id)
          .eq('event_id', r.event_id)
        if (updErr) {
          errors.push(`update sent_at failed for ${r.event_id}: ${updErr.message}`)
        } else {
          sent++
        }
      } catch (e) {
        errors.push(
          `send failed for ${r.event_id}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        )
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
