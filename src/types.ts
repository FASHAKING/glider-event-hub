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

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'monthly_nth_day'

export interface EventRecurrence {
  frequency: RecurrenceFrequency
  /** number of occurrences after the first; 0 means just the first one */
  occurrences: number
  /** 0=Sun..6=Sat. For 'weekly' with specific days, or the target day for 'monthly_nth_day'. */
  daysOfWeek?: number[]
  /** 1=1st, 2=2nd, 3=3rd, 4=4th, 5=last. Only for 'monthly_nth_day'. */
  weekOfMonth?: number
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

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const ORDINAL_LABELS = ['', '1st', '2nd', '3rd', '4th', 'last'] as const

/**
 * Returns the date of the Nth occurrence of `dayOfWeek` (0=Sun..6=Sat) in the
 * given month. For n=5 ("last"), finds the last occurrence by searching
 * backward from the end of the month.
 */
export function getNthWeekdayOfMonth(
  year: number,
  month: number, // 0-based
  dayOfWeek: number,
  n: number, // 1-4, or 5 for "last"
): Date | null {
  if (n === 5) {
    // Last occurrence: start from the last day and walk backward
    const lastDay = new Date(year, month + 1, 0) // last day of month
    for (let d = lastDay.getDate(); d >= 1; d--) {
      const dt = new Date(year, month, d)
      if (dt.getDay() === dayOfWeek) return dt
    }
    return null
  }
  // Nth occurrence: walk forward from the 1st
  let count = 0
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(year, month, d)
    if (dt.getMonth() !== month) break // went past end of month
    if (dt.getDay() === dayOfWeek) {
      count++
      if (count === n) return dt
    }
  }
  return null // e.g. no 5th Monday in this month — shouldn't happen with n<=4
}

/** Human-readable label for a recurrence rule */
export function formatRecurrenceLabel(rec: EventRecurrence): string {
  if (rec.frequency === 'monthly_nth_day' && rec.daysOfWeek?.length && rec.weekOfMonth) {
    const ordinal = ORDINAL_LABELS[rec.weekOfMonth] || ''
    const day = DAY_NAMES_LONG[rec.daysOfWeek[0]] || ''
    return `every ${ordinal} ${day}`
  }
  if (rec.frequency === 'weekly' && rec.daysOfWeek && rec.daysOfWeek.length > 0) {
    // Sort so display order is Mon-Sun
    const sorted = [...rec.daysOfWeek].sort((a, b) => {
      // Mon=1 first .. Sun=0 last
      const order = (d: number) => (d === 0 ? 7 : d)
      return order(a) - order(b)
    })
    return `every ${sorted.map((d) => DAY_NAMES_SHORT[d]).join(', ')}`
  }
  return `repeats ${rec.frequency}`
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

    const freq = e.recurrence.frequency
    const count = e.recurrence.occurrences
    const start = new Date(e.startsAt)

    // --- monthly_nth_day: e.g. "every 3rd Wednesday" ---
    if (freq === 'monthly_nth_day') {
      const dow = e.recurrence.daysOfWeek?.[0] ?? start.getDay()
      const week = e.recurrence.weekOfMonth ?? 1
      const hours = start.getHours()
      const mins = start.getMinutes()
      const secs = start.getSeconds()
      const ms = start.getMilliseconds()
      let idx = 0
      for (let i = 1; idx < count; i++) {
        const targetMonth = start.getMonth() + i
        const targetYear = start.getFullYear() + Math.floor(targetMonth / 12)
        const normalizedMonth = ((targetMonth % 12) + 12) % 12
        const dt = getNthWeekdayOfMonth(targetYear, normalizedMonth, dow, week)
        if (!dt) continue // skip months where the Nth weekday doesn't exist
        dt.setHours(hours, mins, secs, ms)
        idx++
        out.push({
          ...e,
          id: `${e.id}-r${idx}`,
          startsAt: dt.toISOString(),
        })
      }
      continue
    }

    // --- weekly with specific days of the week ---
    if (freq === 'weekly' && e.recurrence.daysOfWeek && e.recurrence.daysOfWeek.length > 0) {
      const days = [...e.recurrence.daysOfWeek].sort()
      const startDay = start.getDay()
      const hours = start.getHours()
      const mins = start.getMinutes()
      const secs = start.getSeconds()
      const ms = start.getMilliseconds()
      let idx = 0
      // Week 0 = the week of the start date. Generate occurrences for remaining
      // days in that week, then full weeks after that.
      for (let week = 0; idx < count; week++) {
        for (const dow of days) {
          if (idx >= count) break
          // Calculate offset from start date
          let dayOffset = (dow - startDay + 7) % 7 + week * 7
          if (dayOffset === 0 && week === 0) continue // skip the start date itself (it's the original)
          // For week 0, only include days that come after the start day
          if (week === 0 && ((dow - startDay + 7) % 7) === 0) continue
          const dt = new Date(start)
          dt.setDate(start.getDate() + dayOffset)
          dt.setHours(hours, mins, secs, ms)
          idx++
          out.push({
            ...e,
            id: `${e.id}-r${idx}`,
            startsAt: dt.toISOString(),
          })
        }
      }
      continue
    }

    // --- simple interval-based: daily, weekly, biweekly, monthly ---
    if (freq === 'monthly') {
      // Proper month advancement instead of 30-day steps
      const hours = start.getHours()
      const mins = start.getMinutes()
      const secs = start.getSeconds()
      const ms = start.getMilliseconds()
      const startDate = start.getDate()
      for (let i = 1; i <= count; i++) {
        const next = new Date(start)
        next.setMonth(start.getMonth() + i)
        // Clamp to last day of target month if the original date overflows
        // (e.g. Jan 31 → Feb 28)
        if (next.getDate() !== startDate) {
          next.setDate(0) // last day of previous month
        }
        next.setHours(hours, mins, secs, ms)
        out.push({
          ...e,
          id: `${e.id}-r${i}`,
          startsAt: next.toISOString(),
        })
      }
      continue
    }

    const stepDays =
      freq === 'daily'
        ? 1
        : freq === 'weekly'
          ? 7
          : freq === 'biweekly'
            ? 14
            : 0
    if (!stepDays) continue
    for (let i = 1; i <= count; i++) {
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
  /** whether this user wants live-event notifications for all events (not just reminded ones) */
  notifyAllLive?: boolean
  /** whether all notifications are globally muted */
  notificationsMuted?: boolean
  /** event IDs the user has expressed interest in */
  interestedIn?: string[]
}
