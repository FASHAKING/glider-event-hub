export type EventCategory =
  | 'AMA'
  | 'Quiz'
  | 'Workshop'
  | 'Meetup'
  | 'Hackathon'
  | 'Launch'

export type EventAccent = 'mint' | 'olive' | 'sky'

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface EventRecurrence {
  frequency: RecurrenceFrequency
  /** number of occurrences after the first; 0 means just the first one */
  occurrences: number
}

export interface GliderEvent {
  id: string
  title: string
  description: string
  /** primary host (kept for backwards-compat) */
  host: string
  /** optional list of additional co-hosts */
  hosts?: string[]
  category: EventCategory
  /** ISO string */
  startsAt: string
  /** duration in minutes */
  durationMinutes: number
  link: string
  location?: string
  tags?: string[]
  /** card header gradient accent */
  accent?: EventAccent
  /** Optional uploaded event image, can be a remote URL or a base64 data URL */
  imageUrl?: string
  /** Optional recurrence definition – used to generate occurrences for the calendar */
  recurrence?: EventRecurrence
}

export type EventStatus = 'live' | 'upcoming' | 'past'

export function getEventStatus(e: GliderEvent, now = new Date()): EventStatus {
  const start = new Date(e.startsAt).getTime()
  const end = start + e.durationMinutes * 60_000
  const t = now.getTime()
  if (t < start) return 'upcoming'
  if (t > end) return 'past'
  return 'live'
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00d 00h 00m 00s'
  const s = Math.floor(ms / 1000)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(days)}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`
}

/**
 * Expands a single GliderEvent that has a recurrence rule into a flat list
 * of occurrences. The original event is included as the first occurrence.
 */
export function expandRecurringEvents(events: GliderEvent[]): GliderEvent[] {
  const out: GliderEvent[] = []
  for (const e of events) {
    out.push(e)
    if (!e.recurrence || e.recurrence.frequency === 'none') continue
    const stepDays =
      e.recurrence.frequency === 'daily'
        ? 1
        : e.recurrence.frequency === 'weekly'
          ? 7
          : e.recurrence.frequency === 'biweekly'
            ? 14
            : e.recurrence.frequency === 'monthly'
              ? 30
              : 0
    if (!stepDays) continue
    for (let i = 1; i <= e.recurrence.occurrences; i++) {
      const next = new Date(e.startsAt)
      next.setDate(next.getDate() + stepDays * i)
      out.push({
        ...e,
        id: `${e.id}-r${i}`,
        startsAt: next.toISOString(),
      })
    }
  }
  return out
}

/* ----------------------------------------------------------------------- */
/* User accounts + connected socials                                        */
/* ----------------------------------------------------------------------- */

export type SocialPlatform = 'x' | 'telegram' | 'discord' | 'email'

export interface SocialConnection {
  /** the platform handle the user provided */
  handle: string
  /** ISO timestamp of when the user connected this platform */
  connectedAt: string
  /** whether notifications are enabled for this platform */
  notifications: boolean
  /** Server-side identifier (e.g. Telegram chat_id) used by the bot */
  externalId?: string
}

export type SocialConnections = Partial<Record<SocialPlatform, SocialConnection>>

export interface UserAccount {
  id: string
  username: string
  email: string
  /** stored client side only – plaintext is fine for this demo */
  passwordHash: string
  createdAt: string
  socials: SocialConnections
  /** ids (or compound ids for recurring instances) the user has bookmarked */
  remindersFor: string[]
}
