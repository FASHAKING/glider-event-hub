/**
 * The preset category names that ship with the app. `GliderEvent.category`
 * is widened to `string` so community submissions can provide custom values,
 * but these presets still drive the category icon lookup and the sample data.
 */
export type EventCategory =
  | 'AMA'
  | 'Quiz'
  | 'Workshop'
  | 'Meetup'
  | 'Hackathon'
  | 'Launch'

export const PRESET_CATEGORIES: EventCategory[] = [
  'AMA',
  'Quiz',
  'Workshop',
  'Meetup',
  'Hackathon',
  'Launch',
]

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
  /** Free-form category name. One of PRESET_CATEGORIES for built-ins. */
  category: string
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
  /** Whether this event is pinned/featured at the top */
  isFeatured?: boolean
  /** Approval status: pending submissions await admin review */
  status?: 'pending' | 'approved' | 'rejected'
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
/* Badge & attendance system                                                */
/* ----------------------------------------------------------------------- */

export type BadgeId =
  | 'first_event'
  | 'event_explorer'
  | 'event_veteran'
  | 'event_legend'
  | 'ama_fan'
  | 'quiz_master'
  | 'workshop_grad'
  | 'social_butterfly'
  | 'early_bird'

export interface Badge {
  id: BadgeId
  label: string
  description: string
  emoji: string
  /** points this badge adds to the leaderboard score */
  points: number
}

export const BADGES: Badge[] = [
  { id: 'first_event', label: 'First Steps', description: 'Attended your first event', emoji: '🎉', points: 10 },
  { id: 'event_explorer', label: 'Explorer', description: 'Attended 5 events', emoji: '🧭', points: 25 },
  { id: 'event_veteran', label: 'Veteran', description: 'Attended 10 events', emoji: '⭐', points: 50 },
  { id: 'event_legend', label: 'Legend', description: 'Attended 25 events', emoji: '👑', points: 100 },
  { id: 'ama_fan', label: 'AMA Fan', description: 'Attended 3 AMAs', emoji: '🎤', points: 15 },
  { id: 'quiz_master', label: 'Quiz Master', description: 'Attended 3 Quizzes', emoji: '🧠', points: 15 },
  { id: 'workshop_grad', label: 'Workshop Grad', description: 'Attended 3 Workshops', emoji: '🔧', points: 15 },
  { id: 'social_butterfly', label: 'Social Butterfly', description: 'Connected 3+ socials', emoji: '🦋', points: 20 },
  { id: 'early_bird', label: 'Early Bird', description: 'Attended an event within 1 hour of signup', emoji: '🐦', points: 10 },
]

/** Points awarded per attended event */
export const POINTS_PER_EVENT = 5

/** Compute the total leaderboard score for a user */
export function computeScore(user: UserAccount): number {
  const eventPoints = (user.attendedEvents?.length || 0) * POINTS_PER_EVENT
  const badgePoints = (user.earnedBadges || []).reduce((sum, bid) => {
    const badge = BADGES.find((b) => b.id === bid)
    return sum + (badge?.points || 0)
  }, 0)
  return eventPoints + badgePoints
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
  /** optional profile picture URL (or base64) */
  avatarUrl?: string
  /** stored client side only – plaintext is fine for this demo */
  passwordHash: string
  createdAt: string
  socials: SocialConnections
  /** ids (or compound ids for recurring instances) the user has bookmarked */
  remindersFor: string[]
  /** event ids the user has marked as attended */
  attendedEvents: string[]
  /** badge ids the user has earned */
  earnedBadges: BadgeId[]
  /** whether this user has admin privileges */
  isAdmin?: boolean
  /** whether all notifications are globally muted */
  notificationsMuted?: boolean
  /** event IDs the user has expressed interest in */
  interestedIn?: string[]
}
