import { useState } from 'react'
import type { GlideEvent, EventCategory } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (e: GlideEvent) => void
}

const categories: EventCategory[] = [
  'AMA',
  'Quiz',
  'Workshop',
  'Meetup',
  'Hackathon',
  'Launch',
]

export default function SubmitEventModal({ open, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [host, setHost] = useState('')
  const [category, setCategory] = useState<EventCategory>('AMA')
  const [startsAt, setStartsAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [link, setLink] = useState('')
  const [location, setLocation] = useState('')

  if (!open) return null

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!title || !host || !startsAt || !link) return
    const event: GlideEvent = {
      id: `user-${Date.now()}`,
      title,
      description,
      host,
      category,
      startsAt: new Date(startsAt).toISOString(),
      durationMinutes: Number(durationMinutes) || 60,
      link,
      location: location || undefined,
      tags: ['community-submitted'],
    }
    onSubmit(event)
    setTitle('')
    setDescription('')
    setHost('')
    setStartsAt('')
    setDurationMinutes(60)
    setLink('')
    setLocation('')
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="card w-full max-w-lg p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">Submit an Event</h2>
            <p className="text-sm text-white/60">
              Share a Glide community event. Stored locally for now.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid gap-3">
          <Field label="Title">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Glide Community AMA"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px]"
              placeholder="What's the event about?"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Host">
              <input
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="input"
                placeholder="@handle or team"
              />
            </Field>
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="input"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <Field label="Link">
            <input
              required
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </Field>

          <Field label="Location (optional)">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              placeholder="X Spaces, Discord, IRL city..."
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Cancel
          </button>
          <button type="submit" className="btn-primary text-sm">
            Submit
          </button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid #1c2438;
          border-radius: 0.75rem;
          padding: 0.55rem 0.8rem;
          font-size: 0.9rem;
          color: white;
          outline: none;
        }
        .input:focus { border-color: rgba(94,234,212,0.6); }
      `}</style>
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
      <span className="block text-xs uppercase tracking-wide text-white/50 mb-1">
        {label}
      </span>
      {children}
    </label>
  )
}
