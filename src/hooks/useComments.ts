import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface Comment {
  id: string
  eventId: string
  userId: string
  username: string
  body: string
  createdAt: string
}

interface UseCommentsResult {
  comments: Comment[]
  loading: boolean
  postComment: (
    body: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
}

const STORAGE_KEY = 'glider-event-hub:comments'

function loadLocalComments(): Comment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Comment[]) : []
  } catch {
    return []
  }
}
function saveLocalComments(comments: Comment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments))
}

export function useComments(
  eventId: string | null,
  currentUserId: string | null,
  currentUsername: string | null,
): UseCommentsResult {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!eventId) return

    // ----- demo mode -------------------------------------------------------
    if (!isSupabaseConfigured || !supabase) {
      setComments(loadLocalComments().filter((c) => c.eventId === eventId))
      return
    }

    // ----- supabase mode ---------------------------------------------------
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('Failed to load comments:', error.message)
      setLoading(false)
      return
    }

    setComments(
      (data || []).map((row) => ({
        id: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        username: row.username,
        body: row.body,
        createdAt: row.created_at,
      })),
    )
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const postComment = useCallback<UseCommentsResult['postComment']>(
    async (body) => {
      if (!eventId) return { ok: false, error: 'No event selected.' }
      if (!currentUserId || !currentUsername)
        return { ok: false, error: 'Sign in to comment.' }

      const trimmed = body.trim()
      if (!trimmed) return { ok: false, error: 'Comment cannot be empty.' }

      // ----- demo mode -----------------------------------------------------
      if (!isSupabaseConfigured || !supabase) {
        const newComment: Comment = {
          id: `c-${Date.now()}`,
          eventId,
          userId: currentUserId,
          username: currentUsername,
          body: trimmed,
          createdAt: new Date().toISOString(),
        }
        const all = [...loadLocalComments(), newComment]
        saveLocalComments(all)
        setComments(all.filter((c) => c.eventId === eventId))
        return { ok: true }
      }

      // ----- supabase mode -------------------------------------------------
      const { error } = await supabase.from('comments').insert({
        event_id: eventId,
        user_id: currentUserId,
        username: currentUsername,
        body: trimmed,
      })
      if (error) return { ok: false, error: error.message }
      await refresh()
      return { ok: true }
    },
    [eventId, currentUserId, currentUsername, refresh],
  )

  return { comments, loading, postComment }
}
