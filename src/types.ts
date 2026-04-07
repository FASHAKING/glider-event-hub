export type EventCategory =
  | 'AMA'
  | 'Quiz'
  | 'Workshop'
  | 'Meetup'
  | 'Hackathon'
  | 'Launch'

export interface GlideEvent {
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
}

export type EventStatus = 'live' | 'upcoming' | 'past'

export function getEventStatus(e: GlideEvent, now = new Date()): EventStatus {
  const start = new Date(e.startsAt).getTime()
  const end = start + e.durationMinutes * 60_000
  const t = now.getTime()
  if (t < start) return 'upcoming'
  if (t > end) return 'past'
  return 'live'
}
