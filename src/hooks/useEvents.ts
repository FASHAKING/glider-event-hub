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
    isFeatured: (row as any).is_featured || false,
    recurrence:
      row.recurrence_freq && row.recurrence_freq !== 'none'
        ? {
            frequency: row.recurrence_freq as RecurrenceFrequency,
            occurrences: row.recurrence_count || 0,
            daysOfWeek: row.recurrence_days_of_week || undefined,
            weekOfMonth: row.recurrence_week_of_month || undefined,
          }
        : undefined,
  }
}

/** Strip the `-rN` suffix from recurring instance IDs to get the real DB id */
function baseEventId(id: string): string {
  return id.replace(/-r\d+$/, '')
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
  submitEvent: (
    e: Omit<GliderEvent, 'id'> & { imageFile?: File | null },
  ) => Promise<{ ok: true; event: GliderEvent } | { ok: false; error: string }>
  updateEvent: (
    id: string,
    updates: Partial<Omit<GliderEvent, 'id'>>,
    imageFile?: File | null,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  deleteEvent: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>
  toggleFeatured: (id: string, featured: boolean) => Promise<{ ok: true } | { ok: false; error: string }>
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
        if (upErr) {
          // Storage upload failed (likely missing bucket or RLS policies).
          // Continue without the image rather than blocking the submission.
          console.warn('Image upload failed, submitting without image:', upErr.message)
          imageUrl = undefined
        } else {
          const { data: publicUrlData } = supabase.storage
            .from(EVENT_BUCKET)
            .getPublicUrl(path)
          imageUrl = publicUrlData.publicUrl
        }
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
        recurrence_days_of_week: input.recurrence?.daysOfWeek || null,
        recurrence_week_of_month: input.recurrence?.weekOfMonth || null,
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

  const updateEvent = useCallback<UseEventsResult['updateEvent']>(
    async (rawId, updates, imageFile) => {
      const id = baseEventId(rawId)
      // ----- demo mode --------------------------------------------------
      if (!isSupabaseConfigured || !supabase) {
        // For demo mode, if a new image file was provided, read it as base64
        if (imageFile) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(imageFile)
          })
          updates = { ...updates, imageUrl: dataUrl }
        }
        const local = loadLocalUserEvents()
        const idx = local.findIndex((e) => e.id === id)
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...updates }
          saveLocalUserEvents(local)
          setEvents([...sampleEvents, ...local])
        } else {
          setEvents((prev) =>
            prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          )
        }
        return { ok: true }
      }

      // ----- supabase mode ---------------------------------------------
      // Handle image upload if a new file was provided
      if (imageFile && currentUserId) {
        const path = `${currentUserId}/${Date.now()}-${imageFile.name}`
        const { error: storageErr } = await supabase.storage
          .from(EVENT_BUCKET)
          .upload(path, imageFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: imageFile.type,
          })
        if (storageErr) {
          console.warn('Image upload failed during edit:', storageErr.message)
        } else {
          const { data: publicUrlData } = supabase.storage
            .from(EVENT_BUCKET)
            .getPublicUrl(path)
          updates = { ...updates, imageUrl: publicUrlData.publicUrl }
        }
      }

      const patch: Database['public']['Tables']['events']['Update'] = {}
      if (updates.title !== undefined) patch.title = updates.title
      if (updates.description !== undefined) patch.description = updates.description
      if (updates.host !== undefined) patch.host = updates.host
      if (updates.hosts !== undefined) patch.hosts = updates.hosts
      if (updates.category !== undefined) patch.category = updates.category
      if (updates.startsAt !== undefined) patch.starts_at = updates.startsAt
      if (updates.durationMinutes !== undefined) patch.duration_minutes = updates.durationMinutes
      if (updates.link !== undefined) patch.link = updates.link
      if (updates.location !== undefined) patch.location = updates.location || null
      if (updates.tags !== undefined) patch.tags = updates.tags
      if (updates.accent !== undefined) patch.accent = updates.accent
      if (updates.imageUrl !== undefined) patch.image_url = updates.imageUrl || null
      if (updates.recurrence !== undefined) {
        patch.recurrence_freq = updates.recurrence?.frequency || null
        patch.recurrence_count = updates.recurrence?.occurrences || null
        patch.recurrence_days_of_week = updates.recurrence?.daysOfWeek || null
        patch.recurrence_week_of_month = updates.recurrence?.weekOfMonth || null
      }
      if (updates.isFeatured !== undefined) patch.is_featured = updates.isFeatured

      const { error: upErr } = await supabase
        .from('events')
        .update(patch)
        .eq('id', id)
      if (upErr) return { ok: false, error: upErr.message }

      await refresh()
      return { ok: true }
    },
    [refresh, currentUserId],
  )

  const deleteEvent = useCallback<UseEventsResult['deleteEvent']>(
    async (rawId) => {
      const id = baseEventId(rawId)
      // ----- demo mode --------------------------------------------------
      if (!isSupabaseConfigured || !supabase) {
        const local = loadLocalUserEvents().filter((e) => e.id !== id)
        saveLocalUserEvents(local)
        setEvents([...sampleEvents, ...local])
        return { ok: true }
      }

      // ----- supabase mode ---------------------------------------------
      const { error: delErr } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
      if (delErr) return { ok: false, error: delErr.message }

      setEvents((prev) => prev.filter((e) => e.id !== id))
      return { ok: true }
    },
    [],
  )

  const toggleFeatured = useCallback<UseEventsResult['toggleFeatured']>(
    async (rawId, featured) => {
      const id = baseEventId(rawId)
      // ----- demo mode --------------------------------------------------
      if (!isSupabaseConfigured || !supabase) {
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, isFeatured: featured } : e)),
        )
        return { ok: true }
      }

      // ----- supabase mode ---------------------------------------------
      const { error: upErr } = await supabase
        .from('events')
        .update({ is_featured: featured })
        .eq('id', id)
      if (upErr) return { ok: false, error: upErr.message }

      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isFeatured: featured } : e)),
      )
      return { ok: true }
    },
    [],
  )

  return { events, loading, error, submitEvent, updateEvent, deleteEvent, toggleFeatured, refresh }
}
