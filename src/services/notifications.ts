import type { GliderEvent, SocialPlatform, UserAccount } from '../types'

/**
 * Front-end notification dispatcher.
 *
 * In production this would call a server endpoint that actually pushes
 * messages to X / Telegram / Discord. For this client-only build we
 * simulate that by:
 *
 *   1. Showing a browser Notification (if the user has granted permission).
 *   2. Logging the payload to the console with the platforms it would have
 *      been sent to.
 *   3. Storing a record in localStorage so a future "Notification Center"
 *      view can render history.
 */

const HISTORY_KEY = 'glider-event-hub:notifications'

export type NotificationKind =
  | 'event-live'
  | 'event-soon'
  | 'event-updated'
  | 'reminder-set'

export interface NotificationRecord {
  id: string
  userId: string
  eventId: string
  kind: NotificationKind
  title: string
  body: string
  platforms: SocialPlatform[]
  sentAt: string
}

function loadHistory(): NotificationRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as NotificationRecord[]) : []
  } catch {
    return []
  }
}

function saveHistory(history: NotificationRecord[]) {
  // keep history bounded
  const trimmed = history.slice(-100)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
}

export function getNotificationHistory(userId: string): NotificationRecord[] {
  return loadHistory()
    .filter((n) => n.userId === userId)
    .reverse()
}

export function clearNotificationHistory(userId: string) {
  const next = loadHistory().filter((n) => n.userId !== userId)
  saveHistory(next)
}

function maybeShowBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body })
    } catch {
      /* ignore */
    }
  }
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied'
  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission()
    } catch {
      return 'denied'
    }
  }
  return Notification.permission
}

interface DispatchOpts {
  user: UserAccount
  event: GliderEvent
  kind: NotificationKind
  title: string
  body: string
}

export function dispatchEventNotification({
  user,
  event,
  kind,
  title,
  body,
}: DispatchOpts): NotificationRecord | null {
  const platforms = (Object.entries(user.socials) as [
    SocialPlatform,
    { notifications: boolean },
  ][])
    .filter(([, c]) => c?.notifications)
    .map(([p]) => p)

  if (platforms.length === 0) return null

  const record: NotificationRecord = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: user.id,
    eventId: event.id,
    kind,
    title,
    body,
    platforms,
    sentAt: new Date().toISOString(),
  }

  const history = loadHistory()
  history.push(record)
  saveHistory(history)

  // simulate the platform deliveries
  // eslint-disable-next-line no-console
  console.info(
    `[notifications] -> ${platforms.join(', ')} | ${title} :: ${body}`,
  )

  maybeShowBrowserNotification(title, body)

  return record
}
