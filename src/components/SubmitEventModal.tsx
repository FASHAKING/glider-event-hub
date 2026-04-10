import { useRef, useState } from 'react'
import type { GliderEvent, RecurrenceFrequency } from '../types'
import { PRESET_CATEGORIES } from '../types'

export interface SubmitEventPayload extends Omit<GliderEvent, 'id'> {
  imageFile?: File | null
}

interface Props {
  open: boolean
  onClose: () => void
  isAdmin?: boolean
  onSubmit: (
    e: SubmitEventPayload,
  ) => Promise<{ ok: true } | { ok: false; error: string }> | void
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
  { value: 'monthly_nth_day', label: 'Monthly (specific day)' },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const ORDINAL_OPTIONS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: 'Last' },
] as const

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024 // 1.5 MB

export default function SubmitEventModal({ open, onClose, isAdmin, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hostsCsv, setHostsCsv] = useState('')
  const [category, setCategory] = useState<string>('AMA')
  const [startsAt, setStartsAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [link, setLink] = useState('')
  const [platform, setPlatform] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('none')
  const [occurrences, setOccurrences] = useState<number>(4)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [weekOfMonth, setWeekOfMonth] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
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
    setImageFile(null)
    setImagePreview(null)
    setImageError(null)
    setRecurrence('none')
    setOccurrences(4)
    setDaysOfWeek([])
    setWeekOfMonth(1)
    setSubmitError(null)
    setSubmitted(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImage = (file: File | undefined) => {
    setImageError(null)
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be under 1.5 MB.')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.onerror = () => setImageError('Could not read that file.')
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const hosts = hostsCsv
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean)
      .slice(0, 3)
    if (
      !title ||
      hosts.length === 0 ||
      !category.trim() ||
      !startsAt ||
      !link ||
      !platform.trim()
    )
      return

    setSubmitError(null)
    setSubmitting(true)

    const payload: SubmitEventPayload = {
      title,
      description,
      host: hosts[0],
      hosts: hosts.slice(1),
      category: category.trim(),
      startsAt: new Date(startsAt).toISOString(),
      durationMinutes: Number(durationMinutes) || 60,
      link,
      location: platform.trim(),
      tags: ['community-submitted'],
      imageUrl: imagePreview || undefined,
      imageFile,
      recurrence:
        recurrence === 'none'
          ? undefined
          : {
              frequency: recurrence,
              occurrences: Math.max(1, occurrences),
              ...(recurrence === 'weekly' && daysOfWeek.length > 0
                ? { daysOfWeek }
                : {}),
              ...(recurrence === 'monthly_nth_day'
                ? { daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [new Date(startsAt).getDay()], weekOfMonth }
                : {}),
            },
    }

    try {
      const result = await onSubmit(payload)
      if (result && 'ok' in result && result.ok === false) {
        setSubmitError(result.error)
        setSubmitting(false)
        return
      }
      if (isAdmin) {
        reset()
      } else {
        // Non-admin: show the pending review message
        setSubmitted(true)
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted && !isAdmin) {
    return (
      <div
        className="fixed inset-0 z-50 bg-glider-black/30 dark:bg-glider-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
        onClick={() => { reset(); onClose() }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="card w-full max-w-lg p-8 shadow-card my-8 text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-glider-mint/20 dark:bg-glider-mint/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-glider-olive dark:text-glider-mint">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-glider-black dark:text-glider-darkText">
            Submitted for Review
          </h2>
          <p className="text-sm text-glider-gray dark:text-glider-darkMuted">
            Your event has been submitted and is awaiting admin approval. Once approved, it will appear on the hub for everyone to see.
          </p>
          <button
            type="button"
            onClick={() => { reset(); onClose() }}
            className="btn-primary text-sm mx-auto"
          >
            Got it
          </button>
        </div>
      </div>
    )
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
              {isAdmin
                ? 'Submit an event that will go live immediately.'
                : 'Submit an event for admin review. Once approved, it will appear on the hub.'}
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
                list="event-category-suggestions"
                placeholder="AMA, Workshop, Party Night…"
              />
              <datalist id="event-category-suggestions">
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
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="input"
                list="event-platform-suggestions"
                placeholder="X Spaces, Discord, Zoom…"
              />
              <datalist id="event-platform-suggestions">
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
                onChange={(e) => {
                  const val = e.target.value as RecurrenceFrequency
                  setRecurrence(val)
                  // Auto-populate day-of-week from start date
                  if (startsAt) {
                    const startDow = new Date(startsAt).getDay()
                    if (val === 'weekly' && daysOfWeek.length === 0) {
                      setDaysOfWeek([startDow])
                    }
                    if (val === 'monthly_nth_day') {
                      if (daysOfWeek.length === 0) setDaysOfWeek([startDow])
                      const d = new Date(startsAt)
                      const weekNum = Math.min(Math.ceil(d.getDate() / 7), 5)
                      setWeekOfMonth(weekNum)
                    }
                  }
                }}
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

          {/* Weekly: day-of-week toggles */}
          {recurrence === 'weekly' && (
            <Field label="Repeat on">
              <div className="flex gap-1.5 flex-wrap">
                {DAY_LABELS.map((label, idx) => {
                  const active = daysOfWeek.includes(idx)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setDaysOfWeek((prev) =>
                          active ? prev.filter((d) => d !== idx) : [...prev, idx],
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        active
                          ? 'bg-glider-olive text-white border-glider-olive dark:bg-glider-mint dark:text-glider-black dark:border-glider-mint'
                          : 'bg-white/50 text-glider-gray border-glider-border hover:border-glider-olive dark:bg-black/30 dark:text-glider-darkMuted dark:border-white/10 dark:hover:border-glider-mint'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </Field>
          )}

          {/* Monthly nth day: day-of-week + ordinal selects */}
          {recurrence === 'monthly_nth_day' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Day of week">
                <select
                  value={daysOfWeek[0] ?? 0}
                  onChange={(e) => setDaysOfWeek([Number(e.target.value)])}
                  className="input"
                >
                  {DAY_NAMES_LONG.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Which one">
                <select
                  value={weekOfMonth}
                  onChange={(e) => setWeekOfMonth(Number(e.target.value))}
                  className="input"
                >
                  {ORDINAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

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
              {imagePreview && (
                <div className="relative h-36 rounded-xl overflow-hidden border border-glider-border dark:border-glider-darkBorder">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setImageFile(null)
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
          <button type="button" onClick={onClose} className="btn-ghost text-sm" disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary text-sm" disabled={submitting}>
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
