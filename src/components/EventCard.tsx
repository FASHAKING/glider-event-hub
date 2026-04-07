import type { GlideEvent, EventStatus } from '../types'
import {
  CalendarIcon,
  UserIcon,
  PinIcon,
  ExternalIcon,
  LiveDotIcon,
  CategoryIcon,
} from './Icons'

const statusStyles: Record<EventStatus, string> = {
  live: 'border-red-200 bg-red-50 text-red-600',
  upcoming: 'border-glide-mint bg-glide-mint/40 text-glide-olive',
  past: 'border-glide-border bg-glide-light text-glide-gray',
}

const statusLabel: Record<EventStatus, string> = {
  live: 'LIVE NOW',
  upcoming: 'UPCOMING',
  past: 'PAST',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function relative(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const hrs = Math.round(mins / 60)
  const days = Math.round(hrs / 24)
  const val = days >= 1 ? `${days}d` : hrs >= 1 ? `${hrs}h` : `${mins}m`
  return diff >= 0 ? `in ${val}` : `${val} ago`
}

export default function EventCard({
  event,
  status,
}: {
  event: GlideEvent
  status: EventStatus
}) {
  const CatIcon = CategoryIcon[event.category]
  return (
    <article className="card p-5 flex flex-col gap-4 hover:border-glide-olive/40 hover:shadow-card transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <span className={`chip ${statusStyles[status]}`}>
          {status === 'live' && (
            <LiveDotIcon width={10} height={10} className="animate-pulse" />
          )}
          {statusLabel[status]}
        </span>
        <span className="chip border-glide-border bg-glide-light text-glide-gray">
          <CatIcon width={13} height={13} />
          {event.category}
        </span>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold leading-tight text-glide-black">
          {event.title}
        </h3>
        <p className="mt-1.5 text-sm text-glide-gray line-clamp-3">
          {event.description}
        </p>
      </div>

      <div className="text-sm text-glide-gray space-y-1.5">
        <div className="flex items-center gap-2">
          <CalendarIcon width={14} height={14} className="text-glide-olive" />
          <span className="text-glide-black">{formatDate(event.startsAt)}</span>
          <span className="text-glide-gray/80">· {relative(event.startsAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserIcon width={14} height={14} className="text-glide-olive" />
          <span>{event.host}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2">
            <PinIcon width={14} height={14} className="text-glide-olive" />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-full bg-glide-sky/25 border border-glide-sky/60 text-[#2b5d82]"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <a
        href={event.link}
        target="_blank"
        rel="noreferrer"
        className={`mt-auto ${
          status === 'past' ? 'btn-ghost' : status === 'live' ? 'btn-primary' : 'btn-soft'
        } text-sm`}
      >
        {status === 'live'
          ? 'Join Now'
          : status === 'upcoming'
            ? 'Set Reminder'
            : 'View Recap'}
        <ExternalIcon width={14} height={14} />
      </a>
    </article>
  )
}
