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
      className="fixed inset-0 z-50 bg-glide-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="card w-full max-w-lg p-6 space-y-5 shadow-card"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-glide-black">
              Submit an Event
            </h2>
            <p className="text-sm text-glide-gray mt-0.5">
              Share a Glide community event with the hub.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-glide-gray hover:text-glide-black text-2xl leading-none w-8 h-8 rounded-full hover:bg-glide-light flex items-center justify-center"
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

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Cancel
          </button>
          <button type="submit" className="btn-primary text-sm">
            Submit Event
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
      <span className="block text-xs uppercase tracking-wider text-glide-gray font-medium mb-1.5">
        {label}
      </span>
      {children}
    </label>
  )
}
