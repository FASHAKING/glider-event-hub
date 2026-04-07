export type EventCategory =
  | 'AMA'
  | 'Quiz'
  | 'Workshop'
  | 'Meetup'
  | 'Hackathon'
  | 'Launch'

export type EventAccent = 'mint' | 'olive' | 'sky'

export interface GliderEvent {
  id: string
  title: string
  description: string
  host: string
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
