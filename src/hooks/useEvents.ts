import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured, EVENT_BUCKET } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import type {
  EventAccent,
  EventCategory,
  GliderEvent,
  RecurrenceFrequency,
} from '../types'
import { sampleEvents } from '../data/events'

type EventRow = Database['public']['Tables']['events']['Row']

const STORAGE_KEY = 'glider-event-hub:user-events'

function rowToEvent(row: EventRow): GliderEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    host: row.host,
    hosts: row.hosts || [],
    category: row.category as EventCategory,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    link: row.link,
    location: row.location || undefined,
    tags: row.tags || [],
    accent: (row.accent as EventAccent) || 'mint',
    imageUrl: row.image_url || undefined,
    recurrence:
      row.recurrence_freq && row.recurrence_freq !== 'none'
        ? {
            frequency: row.recurrence_freq as RecurrenceFrequency,
            occurrences: row.recurrence_count || 0,
          }
        : undefined,
  }
}

function loadLocalUserEvents(): GliderEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GliderEvent[]) : []
  } catch {
    return []
  }
}
function saveLocalUserEvents(events: GliderEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

interface UseEventsResult {
  events: GliderEvent[]
  loading: boolean
  error: string | null
  /** Submit a new event. In Supabase mode, uploads the image to Storage. */
  submitEvent: (
    e: Omit<GliderEvent, 'id'> & { imageFile?: File | null },
  ) => Promise<{ ok: true; event: GliderEvent } | { ok: false; error: string }>
  refresh: () => Promise<void>
}

export function useEvents(currentUserId: string | null): UseEventsResult {
  const [events, setEvents] = useState<GliderEvent[]>(() =>
    isSupabaseConfigured ? [] : [...sampleEvents, ...loadLocalUserEvents()],
  )
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setEvents([...sampleEvents, ...loadLocalUserEvents()])
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: true })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    const dbEvents = (data || []).map(rowToEvent)
    // If the DB is empty, fall back to the seed list so first-time
    // visitors still see content. Once an admin inserts real events
    // they'll take over.
    setEvents(dbEvents.length > 0 ? dbEvents : sampleEvents)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Re-subscribe to realtime updates so new events show up live
  useEffect(() => {
    const sb = supabase
    if (!isSupabaseConfigured || !sb) return
    const channel = sb
      .channel('events-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => refresh(),
      )
      .subscribe()
    return () => {
      sb.removeChannel(channel)
    }
  }, [refresh])

  const submitEvent = useCallback<UseEventsResult['submitEvent']>(
    async (input) => {
      // ----- demo mode --------------------------------------------------
      if (!isSupabaseConfigured || !supabase) {
        const newEvent: GliderEvent = {
          ...input,
          id: `user-${Date.now()}`,
        }
        const next = [...loadLocalUserEvents(), newEvent]
        saveLocalUserEvents(next)
        setEvents([...sampleEvents, ...next])
        return { ok: true, event: newEvent }
      }

      // ----- supabase mode ---------------------------------------------
      if (!currentUserId)
        return { ok: false, error: 'You need to sign in to submit an event.' }

      let imageUrl: string | undefined = input.imageUrl
      if (input.imageFile) {
        const path = `${currentUserId}/${Date.now()}-${input.imageFile.name}`
        const { error: upErr } = await supabase.storage
          .from(EVENT_BUCKET)
          .upload(path, input.imageFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: input.imageFile.type,
          })
        if (upErr) return { ok: false, error: upErr.message }
        const { data: publicUrlData } = supabase.storage
          .from(EVENT_BUCKET)
          .getPublicUrl(path)
        imageUrl = publicUrlData.publicUrl
      }

      const insert: Database['public']['Tables']['events']['Insert'] = {
        title: input.title,
        description: input.description,
        host: input.host,
        hosts: input.hosts || [],
        category: input.category,
        starts_at: input.startsAt,
        duration_minutes: input.durationMinutes,
        link: input.link,
        location: input.location || null,
        tags: input.tags || [],
        accent: input.accent || 'mint',
        image_url: imageUrl || null,
        recurrence_freq: input.recurrence?.frequency || null,
        recurrence_count: input.recurrence?.occurrences || null,
        created_by: currentUserId,
      }

      const { data, error: insErr } = await supabase
        .from('events')
        .insert(insert)
        .select('*')
        .single()
      if (insErr) {
        // If the 'hosts' column is missing from the DB, retry without it
        if (insErr.message.includes('hosts') && insErr.message.includes('schema cache')) {
          const { hosts: _h, ...insertWithoutHosts } = insert
          const { data: retryData, error: retryErr } = await supabase
            .from('events')
            .insert(insertWithoutHosts)
            .select('*')
            .single()
          if (retryErr || !retryData) {
            return { ok: false, error: retryErr?.message || 'Failed to insert event.' }
          }
          const created = rowToEvent(retryData)
          setEvents((prev) => [...prev, created])
          return { ok: true, event: created }
        }
        return { ok: false, error: insErr.message }
      }
      if (!data) {
        return { ok: false, error: 'Failed to insert event.' }
      }
      const created = rowToEvent(data)
      setEvents((prev) => [...prev, created])
      return { ok: true, event: created }
    },
    [currentUserId],
  )

  return { events, loading, error, submitEvent, refresh }
}
