import { useEffect, useMemo, useState } from 'react'
import type { GliderEvent, EventAccent, EventStatus } from '../types'
import { getEventStatus } from '../types'
import { useAuth } from '../context/AuthContext'
import { useComments } from '../hooks/useComments'
import {
  CalendarIcon,
  UserIcon,
  PinIcon,
  ExternalIcon,
  LiveDotIcon,
  getCategoryIcon,

  LinkedinIcon,
  XIcon,
  EmailIcon,
  MessageIcon,
} from './Icons'

interface Props {
  event: GliderEvent | null
  onClose: () => void
  onRequireAuth: () => void
  onEditEvent?: (event: GliderEvent) => void
  onDeleteEvent?: (id: string) => void
  onToggleFeatured?: (id: string, featured: boolean) => void
  onApproveEvent?: (id: string) => void
  onRejectEvent?: (id: string) => void
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

function formatCommentTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function EventDetailModal({ event, onClose, onRequireAuth, onEditEvent, onDeleteEvent, onToggleFeatured, onApproveEvent, onRejectEvent }: Props) {
  const { user, toggleAttendance, hasAttended, toggleInterest, hasInterest } = useAuth()
  const [tick, setTick] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const { comments, loading: commentsLoading, postComment } = useComments(
    event?.id || null,
    user?.id || null,
    user?.username || null,
    user?.avatarUrl,
  )

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
  const attended = hasAttended(event.id)
  const interested = hasInterest(event.id)
  const isPending = event.status === 'pending'
  const isRejected = event.status === 'rejected'

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
        {isPending && (
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="text-sm font-semibold text-amber-300">This event is pending admin approval and is not yet visible to the public.</span>
          </div>
        )}
        {isRejected && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span className="text-sm font-semibold text-red-300">This event was rejected by an admin and is not visible to the community.</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          
          <div className={`relative w-full md:w-[55%] ${event.imageUrl && !imgFailed ? 'min-h-[16rem] md:min-h-[400px] bg-black' : 'h-64 md:h-[400px] bg-gradient-to-br ' + accentGradients[accent]}`}>
            {event.imageUrl && !imgFailed ? (
              <img src={event.imageUrl} alt="" className="w-full h-full object-contain" onError={() => setImgFailed(true)} />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center mix-blend-overlay opacity-30">
                  <CatIcon width={200} height={200} />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent p-8 flex flex-col justify-center">
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

        {/* Admin controls */}
        {user?.isAdmin && (
          <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-5 py-3">
            <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mr-auto flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15v2"/><path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M17.8 19.817l-2.172 1.138a.392.392 0 0 1-.568-.41l.415-2.411-1.757-1.707a.389.389 0 0 1 .217-.665l2.428-.352L17.45 13.3a.392.392 0 0 1 .7 0l1.086 2.11 2.428.352a.389.389 0 0 1 .217.665l-1.757 1.707.415 2.41a.392.392 0 0 1-.568.41L17.8 19.818z"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
              Admin
            </span>
            <button
              type="button"
              onClick={() => onEditEvent?.(event)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-xs font-semibold transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              Edit
            </button>
            <button
              type="button"
              onClick={() => onToggleFeatured?.(event.id, !event.isFeatured)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                event.isFeatured
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={event.isFeatured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              {event.isFeatured ? 'Unpin' : 'Pin'}
            </button>
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => onApproveEvent?.(event.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onRejectEvent?.(event.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs font-semibold transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Reject
                </button>
              </>
            )}
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 text-xs font-semibold transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Sure?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteEvent?.(event.id)
                    onClose()
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

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

                  {/* Interested — for upcoming events */}
                  {status === 'upcoming' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          onRequireAuth()
                          return
                        }
                        toggleInterest(event.id, event.category)
                      }}
                      className={`flex-1 sm:flex-none px-6 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                        interested
                          ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                          : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={interested ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      {interested ? 'Interested' : 'Interested?'}
                    </button>
                  )}

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
                Discussion ({comments.length})
              </div>

              <div className="flex-1 flex flex-col gap-4 min-h-0">
                {/* Comment input or sign-in prompt */}
                {user ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!commentText.trim() || posting) return
                      setCommentError(null)
                      setPosting(true)
                      const result = await postComment(commentText)
                      if (result.ok) {
                        setCommentText('')
                      } else {
                        setCommentError(result.error)
                      }
                      setPosting(false)
                    }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-glider-mint/50 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim() || posting}
                        className="px-4 py-2.5 bg-glider-mint text-black rounded-xl text-sm font-bold hover:bg-[#8CD8C5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        {posting ? '...' : 'Post'}
                      </button>
                    </div>
                    {commentError && (
                      <p className="text-xs text-red-400 px-1">{commentError}</p>
                    )}
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequireAuth()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-center text-sm font-medium text-white/30 hover:bg-white/10 transition-colors"
                  >
                    Sign in to join the discussion.
                  </button>
                )}

                {/* Comments list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {commentsLoading ? (
                    <div className="flex-1 flex items-center justify-center py-10 opacity-40">
                      <p className="text-sm">Loading comments...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-40">
                      <MessageIcon width={32} height={32} className="mb-4 text-white/50" />
                      <p className="text-sm text-balance">No comments yet. Be the first<br/>to share your thoughts!</p>
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-glider-mint/20 border border-glider-mint/30 flex items-center justify-center text-xs font-bold text-glider-mint shrink-0 overflow-hidden">
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt={c.username} className="w-full h-full object-cover" />
                            ) : (
                              c.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="text-sm font-semibold text-white">{c.username}</span>
                          <span className="text-[11px] text-white/30 ml-auto shrink-0">
                            {formatCommentTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">{c.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
