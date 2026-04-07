import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { dispatchEventNotification } from '../services/notifications'
import type { GliderEvent } from '../types'
import { getEventStatus } from '../types'

const STATUS_KEY_PREFIX = 'glider-event-hub:status:'

/**
 * Watches the events list and fires platform notifications when:
 *   - an event the user has reminded transitions from upcoming -> live
 *   - an event the user has reminded is starting in <= 15 minutes
 *   - an event the user has reminded gets updated (description / start time)
 *
 * State per (user, event) is persisted in localStorage so reloads don't fire
 * duplicate notifications.
 */
export function useLiveEventNotifications(events: GliderEvent[]) {
  const { user } = useAuth()
  const lastSnapshotRef = useRef<Record<string, GliderEvent>>({})

  useEffect(() => {
    if (!user) return

    const checkAll = () => {
      for (const event of events) {
        if (!user.remindersFor.includes(event.id)) continue
        const status = getEventStatus(event)
        const stateKey = `${STATUS_KEY_PREFIX}${user.id}:${event.id}`
        const previous = (() => {
          try {
            return localStorage.getItem(stateKey)
          } catch {
            return null
          }
        })()

        // detect "going live" transition
        if (status === 'live' && previous !== 'live') {
          dispatchEventNotification({
            user,
            event,
            kind: 'event-live',
            title: `${event.title} is LIVE`,
            body: `${event.host} just started a ${event.category}. Tap to join.`,
          })
          try {
            localStorage.setItem(stateKey, 'live')
          } catch {
            /* ignore */
          }
          continue
        }

        // detect "starting soon" (within 15m) – only fire once
        if (status === 'upcoming') {
          const msUntilStart =
            new Date(event.startsAt).getTime() - Date.now()
          if (msUntilStart > 0 && msUntilStart <= 15 * 60_000 && previous !== 'soon') {
            const minsUntil = Math.max(1, Math.round(msUntilStart / 60_000))
            dispatchEventNotification({
              user,
              event,
              kind: 'event-soon',
              title: `${event.title} starts soon`,
              body: `Starting in ~${minsUntil} min. We'll ping you again when it goes live.`,
            })
            try {
              localStorage.setItem(stateKey, 'soon')
            } catch {
              /* ignore */
            }
          }
        }

        if (status === 'past' && previous !== 'past') {
          try {
            localStorage.setItem(stateKey, 'past')
          } catch {
            /* ignore */
          }
        }

        // detect updates: compare against snapshot of last render
        const last = lastSnapshotRef.current[event.id]
        if (
          last &&
          (last.startsAt !== event.startsAt ||
            last.description !== event.description ||
            last.link !== event.link)
        ) {
          dispatchEventNotification({
            user,
            event,
            kind: 'event-updated',
            title: `${event.title} was updated`,
            body: 'Details for this event have changed. Tap to review.',
          })
        }
      }

      // refresh snapshot
      const snap: Record<string, GliderEvent> = {}
      for (const e of events) snap[e.id] = e
      lastSnapshotRef.current = snap
    }

    checkAll()
    const id = setInterval(checkAll, 30_000)
    return () => clearInterval(id)
  }, [events, user])
}
