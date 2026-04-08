import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const EVENT_BUCKET =
  (import.meta.env.VITE_SUPABASE_EVENT_BUCKET as string | undefined) ||
  'event-images'

/**
 * Supabase client. `null` if env vars are missing — in that case the
 * app falls back to a localStorage-only "demo mode" so the UI is still
 * usable without configuration.
 */
export const supabase: SupabaseClient<Database> | null =
  url && anonKey
    ? createClient<Database>(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null

export const isSupabaseConfigured = supabase !== null
