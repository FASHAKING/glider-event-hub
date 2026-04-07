import type { GlideEvent, EventStatus } from '../types'

const statusStyles: Record<EventStatus, string> = {
  live: 'border-red-500/40 bg-red-500/10 text-red-300',
  upcoming: 'border-glide-accent/40 bg-glide-accent/10 text-glide-accent',
  past: 'border-white/10 bg-white/5 text-white/60',
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
  return (
    <article className="card p-5 flex flex-col gap-4 hover:border-glide-accent/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <span className={`chip ${statusStyles[status]}`}>
          {status === 'live' && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          )}
          {statusLabel[status]}
        </span>
        <span className="chip border-glide-border bg-white/5 text-white/70">
          {event.category}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-semibold leading-tight">{event.title}</h3>
        <p className="mt-1.5 text-sm text-white/60 line-clamp-3">
          {event.description}
        </p>
      </div>

      <div className="text-sm text-white/70 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-white/40">When</span>
          <span>{formatDate(event.startsAt)}</span>
          <span className="text-white/40">· {relative(event.startsAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40">Host</span>
          <span>{event.host}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2">
            <span className="text-white/40">Where</span>
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-glide-border text-white/60"
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
          status === 'past' ? 'btn-ghost' : 'btn-primary'
        } text-sm`}
      >
        {status === 'live'
          ? 'Join Now'
          : status === 'upcoming'
            ? 'Set Reminder'
            : 'View Recap'}
      </a>
    </article>
  )
}
