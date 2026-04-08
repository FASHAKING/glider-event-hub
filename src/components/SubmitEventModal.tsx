import { useRef, useState } from 'react'
import type { GliderEvent, RecurrenceFrequency } from '../types'
import { PRESET_CATEGORIES } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (e: GliderEvent) => void
}

// Suggestions only — both fields are free-text, so submitters can type
// anything. The datalist just provides autocomplete hints.
const CATEGORY_SUGGESTIONS = PRESET_CATEGORIES
const PLATFORM_SUGGESTIONS = [
  'X Spaces',
  'Discord',
  'Telegram',
  'Zoom',
  'YouTube',
  'Luma',
  'IRL',
  'Other',
]

const recurrences: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024 // 1.5 MB

export default function SubmitEventModal({ open, onClose, onSubmit }: Props) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hostsCsv, setHostsCsv] = useState('')
  const [category, setCategory] = useState<string>('AMA')
  const [startsAt, setStartsAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [link, setLink] = useState('')
  const [platform, setPlatform] = useState<string>('')
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('none')
  const [occurrences, setOccurrences] = useState<number>(4)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const reset = () => {
    setTitle('')
    setDescription('')
    setHostsCsv('')
    setCategory('AMA')
    setStartsAt('')
    setDurationMinutes(60)
    setLink('')
    setPlatform('')
    setImageDataUrl(null)
    setImageError(null)
    setRecurrence('none')
    setOccurrences(4)
    setSubmitError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImage = (file: File | undefined) => {
    setImageError(null)
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be under 1.5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageDataUrl(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.onerror = () => setImageError('Could not read that file.')
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSubmitError(null)
    if (!user) {
      setSubmitError('You need to be signed in to submit an event.')
      return
    }
    const hosts = hostsCsv
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean)
      .slice(0, 3)
    if (!title || hosts.length === 0 || !startsAt || !link || !platform) return

    const startsAtIso = new Date(startsAt).toISOString()
    const duration = Number(durationMinutes) || 60
    const recurrencePayload =
      recurrence === 'none'
        ? null
        : { frequency: recurrence, occurrences: Math.max(1, occurrences) }

    setSubmitting(true)
    try {
      // Snake_case row matching the `events` table schema.
      const row = {
        title,
        description,
        host: hosts[0],
        hosts: hosts.slice(1),
        category,
        starts_at: startsAtIso,
        duration_minutes: duration,
        link,
        location: platform,
        image_url: imageDataUrl,
        tags: ['community-submitted'],
        recurrence: recurrencePayload,
      }

      const { data, error } = await supabase
        .from('events')
        .insert(row)
        .select('id')
        .single()

      if (error) {
        setSubmitError(error.message)
        return
      }

      const event: GliderEvent = {
        id: data?.id ? String(data.id) : `user-${Date.now()}`,
        title,
        description,
        host: hosts[0],
        hosts: hosts.slice(1),
        category,
        startsAt: startsAtIso,
        durationMinutes: duration,
        link,
        location: platform,
        tags: ['community-submitted'],
        imageUrl: imageDataUrl || undefined,
        recurrence: recurrencePayload ?? undefined,
      }
      onSubmit(event)
      reset()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not submit event.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-glider-black/30 dark:bg-glider-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="card w-full max-w-2xl p-6 space-y-5 shadow-card my-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-glider-black dark:text-glider-darkText">
              Submit an Event
            </h2>
            <p className="text-sm text-glider-gray dark:text-glider-darkMuted mt-0.5">
              Share a Glider community event with the hub.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-glider-gray dark:text-glider-darkMuted hover:text-glider-black dark:hover:text-glider-darkText text-2xl leading-none w-8 h-8 rounded-full hover:bg-glider-light dark:hover:bg-glider-darkPanel2 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid gap-4">
          <Field label="Title">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Glider Community AMA"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[100px]"
              placeholder="What's the event about?"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Host(s) — comma separated">
              <input
                required
                value={hostsCsv}
                onChange={(e) => setHostsCsv(e.target.value)}
                className="input"
                placeholder="@core_team, @devrel"
              />
            </Field>
            <Field label="Category">
              <input
                required
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
                placeholder="AMA, Game Night, Launch party…"
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Starts at">
              <input
                required
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Duration (min)">
              <input
                type="number"
                min={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Platform">
              <input
                required
                list="platform-suggestions"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="input"
                placeholder="Discord, X Spaces, Zoom…"
              />
              <datalist id="platform-suggestions">
                {PLATFORM_SUGGESTIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </Field>
            <Field label="Join Link">
              <input
                required
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="input"
                placeholder="https://..."
              />
            </Field>
          </div>

          {/* Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Recurrence">
              <select
                value={recurrence}
                onChange={(e) =>
                  setRecurrence(e.target.value as RecurrenceFrequency)
                }
                className="input"
              >
                {recurrences.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            {recurrence !== 'none' && (
              <Field label="Repeat count (after first)">
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={occurrences}
                  onChange={(e) => setOccurrences(Number(e.target.value))}
                  className="input"
                />
              </Field>
            )}
          </div>

          {/* Image upload */}
          <Field label="Event Image (optional)">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImage(e.target.files?.[0])}
                className="input file:mr-3 file:rounded-lg file:border-0 file:bg-glider-mint/40 file:dark:bg-glider-mint/15 file:px-3 file:py-1.5 file:text-glider-olive file:dark:text-glider-mint file:font-semibold"
              />
              {imageError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {imageError}
                </p>
              )}
              {imageDataUrl && (
                <div className="relative h-36 rounded-xl overflow-hidden border border-glider-border dark:border-glider-darkBorder">
                  <img
                    src={imageDataUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageDataUrl(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </Field>
        </div>

        {submitError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-3 py-2">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-ghost text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit Event'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-medium mb-1.5">
        {label}
      </span>
      {children}
    </label>
  )
}
