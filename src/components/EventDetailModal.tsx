import { useEffect, useMemo, useState } from 'react'
import type { GliderEvent, EventAccent, EventStatus } from '../types'
import { formatCountdown, getEventStatus } from '../types'
import { useAuth } from '../context/AuthContext'
import {
  CalendarIcon,
  UserIcon,
  PinIcon,
  ExternalIcon,
  LiveDotIcon,
  getCategoryIcon,
  ClockIcon,
  LinkedinIcon,
  XIcon,
  EmailIcon,
  MessageIcon,
} from './Icons'

interface Props {
  event: GliderEvent | null
  onClose: () => void
  onRequireAuth: () => void
}

const accentGradients: Record<EventAccent, string> = {
  mint: 'from-glider-mint via-glider-mint/70 to-white dark:from-glider-mint/40 dark:via-glider-mint/20 dark:to-glider-darkPanel',
  olive:
    'from-glider-olive via-glider-olive/70 to-glider-mint dark:from-glider-olive/70 dark:via-glider-olive/40 dark:to-glider-darkPanel',
  sky: 'from-glider-sky via-glider-sky/70 to-white dark:from-glider-sky/40 dark:via-glider-sky/20 dark:to-glider-darkPanel',
}

function formatLong(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function statusLabel(status: EventStatus) {
  if (status === 'live') return 'LIVE'
  if (status === 'past') return 'ENDED'
  return 'UPCOMING'
}

export default function EventDetailModal({ event, onClose, onRequireAuth }: Props) {
  const { user, toggleReminder, hasReminder, toggleAttendance, hasAttended } = useAuth()
  const [tick, setTick] = useState(0)

  // re-render every second so the live countdown stays accurate
  useEffect(() => {
    if (!event) return
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [event])

  // close on Esc
  useEffect(() => {
    if (!event) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [event, onClose])

  // prevent background scroll
  useEffect(() => {
    if (!event) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [event])

  const status = useMemo(
    () => (event ? getEventStatus(event) : 'upcoming'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event, tick],
  )

  if (!event) return null

  const CatIcon = getCategoryIcon(event.category)
  const accent = event.accent || 'mint'
  const start = new Date(event.startsAt)
  const end = new Date(start.getTime() + event.durationMinutes * 60_000)
  const countdownMs = start.getTime() - Date.now()
  const reminderOn = hasReminder(event.id)
  const attended = hasAttended(event.id)

  const allHosts = [event.host, ...(event.hosts || [])].filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      onClick={onClose}
    >
      <button onClick={onClose} className="fixed top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-colors z-[60]">
        ×
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1100px] mt-8 mb-auto flex flex-col gap-6 animate-in slide-in-from-bottom-8 fade-in duration-300"
      >
        <div className="flex flex-col md:flex-row bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          
          <div className={`relative w-full md:w-[55%] h-64 md:h-[400px] bg-gradient-to-br ${accentGradients[accent]}`}>
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80" />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center mix-blend-overlay opacity-30">
                  <CatIcon width={200} height={200} />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent p-8 flex flex-col justify-center">
              <span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase ${status === 'live' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : status === 'past' ? 'bg-white/20 text-white' : 'bg-glider-mint text-black'}`}>
                {status === 'live' && <LiveDotIcon width={8} height={8} className="animate-pulse" />}
                {statusLabel(status)}
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold text-white uppercase tracking-tighter leading-none drop-shadow-lg">
                {event.category} <br/> <span className="text-white/60">EVENT</span>
              </h2>
              <div className="mt-2 text-xs text-white/80 font-mono tracking-wide uppercase">
                {formatLong(event.startsAt)}
              </div>
            </div>
          </div>

          <div className="w-full md:w-[45%] p-8 flex flex-col justify-center relative bg-[#111111]">
            <div className="absolute inset-0 bg-glider-mint/5 blur-[100px] pointer-events-none" />
            
            <span className={`inline-flex items-center gap-1.5 self-start chip border-transparent text-[10px] font-bold tracking-wide mb-4 ${status === 'live' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white/5 text-white/50 border border-white/10'}`}>
              {status === 'live' && <LiveDotIcon width={8} height={8} className="animate-pulse" />}
              {statusLabel(status)}
            </span>
            <div className="text-glider-mint font-semibold text-sm mb-2">{new Date(event.startsAt).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', timeZoneName: 'short'})}, {new Date(event.startsAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</div>
            <h1 className="font-display text-3xl font-bold text-white leading-tight mb-8">
              {event.title}
            </h1>
            
            <a
              href={event.link}
              target="_blank"
              rel="noreferrer"
              className={`w-full max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${status === 'live' ? 'bg-[#E53E3E] hover:bg-[#C53030] text-white shadow-[0_0_20px_rgba(229,62,62,0.4)] hover:-translate-y-0.5' : 'bg-glider-mint hover:bg-[#8CD8C5] text-black shadow-glowMint hover:-translate-y-0.5'}`}
            >
              <ExternalIcon width={16} height={16} />
              {status === 'live' ? 'Join Live' : status === 'past' ? 'View Recap' : 'Join Event'}
            </a>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[65%] flex flex-col gap-6">
            
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-card">
              <div className="flex flex-wrap gap-2 mb-6">
                 {event.tags && event.tags.map((t) => (
                    <span key={t} className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 uppercase font-semibold">
                      #{t}
                    </span>
                  ))}
                  <span className="text-[11px] px-3 py-1 rounded-full bg-glider-mint/10 border border-glider-mint/30 text-glider-mint uppercase font-semibold">
                    #{event.category}
                  </span>
              </div>
              <div className="text-white/80 whitespace-pre-line leading-relaxed text-[15px]">
                {event.description || 'No description provided.'}
              </div>
            </div>

            <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-glider-mint/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex items-center gap-4 text-white font-bold tracking-tight mb-6">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <CalendarIcon width={18} height={18} className="text-white/60" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest leading-none mb-1">
                    {status === 'live' ? 'LIVE NOW' : status === 'past' ? 'ENDED' : 'STARTS AT'}
                  </span>
                  <span>{formatLong(event.startsAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-white font-bold tracking-tight mb-6">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <PinIcon width={18} height={18} className="text-white/60" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest leading-none mb-1">Platform</span>
                  <span>{event.location || 'Discord / Community Platform'}</span>
                </div>
              </div>

               <div className="flex items-center gap-4 text-white font-bold tracking-tight mb-8">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <UserIcon width={18} height={18} className="text-white/60" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest leading-none mb-1">Hosted by</span>
                  <span>{allHosts.join(', ')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-white/10">
                <div className="flex flex-wrap gap-3">
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex-1 sm:flex-none px-10 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${status === 'live' ? 'bg-[#E53E3E] hover:bg-[#C53030] text-white shadow-[0_0_20px_rgba(229,62,62,0.4)] hover:-translate-y-0.5' : 'bg-glider-mint hover:bg-[#8CD8C5] text-black shadow-glowMint hover:-translate-y-0.5'}`}
                  >
                    <ExternalIcon width={16} height={16} />
                    {status === 'live' ? 'Join Live' : status === 'past' ? 'View Recap' : 'Join Event'}
                  </a>

                  {/* Mark as Attended — only for past or live events */}
                  {(status === 'past' || status === 'live') && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          onRequireAuth()
                          return
                        }
                        toggleAttendance(event.id, event.category)
                      }}
                      className={`flex-1 sm:flex-none px-6 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                        attended
                          ? 'bg-glider-olive text-white border border-glider-olive/60 shadow-[0_0_15px_rgba(79,127,88,0.3)]'
                          : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {attended ? '✓ Attended' : 'Mark as Attended'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 font-semibold">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Share</span>
                  <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors text-white/50">
                    <LinkedinIcon width={16} height={16} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors text-white/50">
                    <XIcon width={14} height={14} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors text-white/50">
                    <EmailIcon width={16} height={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[35%] flex flex-col">
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 shadow-card h-full min-h-[400px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-glider-mint to-glider-sky opacity-20" />
              
              <div className="flex items-center gap-2 text-white font-bold text-lg mb-6 pb-4 border-b border-white/5">
                <MessageIcon width={20} height={20} className="text-glider-mint" />
                Discussion (0)
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <button
                  type="button" 
                  onClick={() => {
                    if (!user) onRequireAuth()
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-center text-sm font-medium text-white/30 hover:bg-white/10 transition-colors"
                >
                  Sign in to join the discussion.
                </button>

                <div className="flex-1 flex flex-col items-center justify-center text-center mt-10 opacity-40">
                  <MessageIcon width={32} height={32} className="mb-4 text-white/50" />
                  <p className="text-sm text-balance">No comments yet. Be the first<br/>to share your thoughts!</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

function MetaBlock({
  icon,
  label,
  value,
  sub,
  mono,
}: {
  icon: JSX.Element
  label: string
  value: string
  sub?: string
  mono?: boolean
}) {
  return (
    <div className="bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-semibold">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 font-semibold text-glider-black dark:text-glider-darkText ${
          mono ? 'tabular-nums text-base' : 'text-sm'
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs text-glider-gray dark:text-glider-darkMuted mt-0.5">
          {sub}
        </div>
      )}
    </div>
  )
}
