import { useEffect, useRef, useState } from 'react'
import type { GliderEvent, RecurrenceFrequency } from '../types'
import { PRESET_CATEGORIES } from '../types'

interface Props {
  event: GliderEvent | null
  onClose: () => void
  onSave: (
    id: string,
    updates: Partial<Omit<GliderEvent, 'id'>>,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
}

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

function toLocalDatetime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditEventModal({ event, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hostsCsv, setHostsCsv] = useState('')
  const [category, setCategory] = useState<string>('AMA')
  const [startsAt, setStartsAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [link, setLink] = useState('')
  const [platform, setPlatform] = useState<string>('')
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('none')
  const [occurrences, setOccurrences] = useState<number>(4)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Pre-populate when event changes
  useEffect(() => {
    if (!event) return
    setTitle(event.title)
    setDescription(event.description)
    const allHosts = [event.host, ...(event.hosts || [])].filter(Boolean)
    setHostsCsv(allHosts.join(', '))
    setCategory(event.category)
    setStartsAt(toLocalDatetime(event.startsAt))
    setDurationMinutes(event.durationMinutes)
    setLink(event.link)
    setPlatform(event.location || '')
    setRecurrence(event.recurrence?.frequency || 'none')
    setOccurrences(event.recurrence?.occurrences || 4)
    setSaveError(null)
  }, [event])

  if (!event) return null

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

    setSaveError(null)
    setSaving(true)

    const updates: Partial<Omit<GliderEvent, 'id'>> = {
      title,
      description,
      host: hosts[0],
      hosts: hosts.slice(1),
      category: category.trim(),
      startsAt: new Date(startsAt).toISOString(),
      durationMinutes: Number(durationMinutes) || 60,
      link,
      location: platform.trim(),
      recurrence:
        recurrence === 'none'
          ? undefined
          : { frequency: recurrence, occurrences: Math.max(1, occurrences) },
    }

    try {
      const result = await onSave(event.id, updates)
      if (!result.ok) {
        setSaveError(result.error)
        setSaving(false)
        return
      }
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-glider-black/30 dark:bg-glider-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <form
        ref={formRef}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="card w-full max-w-2xl p-6 space-y-5 shadow-card my-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-glider-black dark:text-glider-darkText">
              Edit Event
            </h2>
            <p className="text-sm text-glider-gray dark:text-glider-darkMuted mt-0.5">
              Update the event details below.
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
                list="edit-event-category-suggestions"
                placeholder="AMA, Workshop, Party Night…"
              />
              <datalist id="edit-event-category-suggestions">
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
                list="edit-event-platform-suggestions"
                placeholder="X Spaces, Discord, Zoom…"
              />
              <datalist id="edit-event-platform-suggestions">
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
        </div>

        {saveError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-3 py-2">
            {saveError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost text-sm" disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
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
