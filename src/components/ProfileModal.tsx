import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  ensureNotificationPermission,
  getNotificationHistory,
  getNotificationHistoryFromDb,
  type NotificationRecord,
} from '../services/notifications'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { SocialPlatform } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  /** Optional bot username, used to build the t.me link */
  telegramBotUsername?: string
}

const platforms: {
  key: SocialPlatform
  name: string
  placeholder: string
  hint: string
  icon: JSX.Element
  color: string
  /** Always-on channel that uses the account email; no Connect step. */
  alwaysOn?: boolean
}[] = [
  {
    key: 'email',
    name: 'Email',
    placeholder: '',
    hint: 'Get notified at the email you signed up with whenever a tracked event goes live.',
    color: 'bg-glider-olive text-white dark:bg-glider-mint dark:text-glider-black',
    alwaysOn: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
  {
    key: 'x',
    name: 'X (Twitter)',
    placeholder: '@yourhandle',
    hint: 'We\'ll @-mention you when an event you\'re tracking goes live.',
    color: 'bg-black text-white',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.844l-5.36-7.01L4.6 22H1.34l8.022-9.166L1.5 2h7.02l4.844 6.4L18.244 2zm-1.2 18h1.86L7.04 4H5.05l11.994 16z" />
      </svg>
    ),
  },
  {
    key: 'telegram',
    name: 'Telegram',
    placeholder: '@telegram_handle',
    hint: 'Tap "Connect" to get a one-time code, then start the Glider bot to link your chat.',
    color: 'bg-[#229ED9] text-white',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.04 15.36l-.36 5.12c.52 0 .74-.22 1.02-.49l2.45-2.34 5.07 3.72c.93.51 1.6.24 1.84-.86l3.34-15.65c.32-1.36-.49-1.9-1.39-1.57L1.7 9.5c-1.34.52-1.32 1.27-.23 1.61l4.95 1.55 11.5-7.25c.54-.34 1.04-.15.63.2L9.04 15.36z" />
      </svg>
    ),
  },
  {
    key: 'discord',
    name: 'Discord',
    placeholder: 'username#0000',
    hint: 'Receive a Discord ping in the Glider community when events start.',
    color: 'bg-[#5865F2] text-white',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.3 5.3A17 17 0 0015 4l-.2.4a15 15 0 00-5.6 0L9 4a17 17 0 00-4.3 1.3A18 18 0 002 16a17 17 0 005.2 2.6l.5-.7c-.9-.3-1.7-.8-2.5-1.3l.6-.4a12 12 0 0012.4 0l.6.4c-.7.5-1.6 1-2.5 1.3l.5.7A17 17 0 0022 16a18 18 0 00-2.7-10.7zM9 14.5c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8c1 0 1.7.8 1.6 1.8 0 1-.7 1.8-1.6 1.8zm6 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8c1 0 1.7.8 1.6 1.8 0 1-.7 1.8-1.6 1.8z" />
      </svg>
    ),
  },
]

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++)
    out += chars.charAt(Math.floor(Math.random() * chars.length))
  return out
}

export default function ProfileModal({
  open,
  onClose,
  telegramBotUsername,
}: Props) {
  const {
    user,
    signOut,
    connectSocial,
    disconnectSocial,
    toggleSocialNotifications,
    notificationsMuted,
    toggleNotificationsMuted,
    toggleNotifyAllLive,
    refresh,
    updateProfile,
  } = useAuth()
  const [draftHandles, setDraftHandles] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'socials' | 'history'>('socials')
  const [isEditing, setIsEditing] = useState(false)
  const [editUsername, setEditUsername] = useState(user?.username || '')
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '')
  const [saving, setSaving] = useState(false)
  const [telegramCode, setTelegramCode] = useState<string | null>(null)
  const [telegramPolling, setTelegramPolling] = useState(false)
  const [history, setHistory] = useState<NotificationRecord[]>([])

  // Load notification history when modal opens
  useEffect(() => {
    if (!open || !user) return
    let alive = true
    const load = async () => {
      const items = isSupabaseConfigured
        ? await getNotificationHistoryFromDb(user.id)
        : getNotificationHistory(user.id)
      if (alive) setHistory(items)
    }
    load()
    return () => {
      alive = false
    }
  }, [open, user, tab])

  // Poll for the Telegram link to complete
  useEffect(() => {
    if (!telegramPolling || !user || !isSupabaseConfigured || !supabase) return
    const id = setInterval(async () => {
      await refresh()
    }, 3000)
    return () => clearInterval(id)
  }, [telegramPolling, user, refresh])

  // Stop polling once telegram is connected
  useEffect(() => {
    if (user?.socials.telegram?.externalId && telegramPolling) {
      setTelegramPolling(false)
      setTelegramCode(null)
    }
  }, [user, telegramPolling])

  if (!open || !user) return null

  const setDraft = (k: SocialPlatform, v: string) =>
    setDraftHandles((d) => ({ ...d, [k]: v }))

  const handleConnect = async (platform: SocialPlatform) => {
    if (platform === 'telegram' && isSupabaseConfigured && supabase) {
      // Generate a one-time link code, store it server-side, then send the
      // user to the Telegram bot.
      const code = randomCode()
      const { error } = await supabase.from('telegram_link_codes').insert({
        code,
        user_id: user.id,
      })
      if (error) {
        alert(error.message)
        return
      }
      setTelegramCode(code)
      setTelegramPolling(true)
      const botUrl = telegramBotUsername
        ? `https://t.me/${telegramBotUsername}?start=${code}`
        : null
      if (botUrl) window.open(botUrl, '_blank', 'noopener')
      return
    }

    const handle = draftHandles[platform] || ''
    const result = await connectSocial(platform, handle)
    if (result.ok) {
      setDraft(platform, '')
      await ensureNotificationPermission()
    } else {
      alert(result.error)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditAvatarUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const result = await updateProfile({
      username: editUsername,
      avatarUrl: editAvatarUrl,
    })
    setSaving(false)
    if (result.ok) {
      setIsEditing(false)
    } else {
      alert(result.error)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-glider-black/40 dark:bg-glider-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-2xl my-8 shadow-card overflow-hidden"
      >
        {/* header */}
        <div className="p-6 border-b border-glider-border dark:border-glider-darkBorder">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-glider-mint/40 dark:bg-glider-mint/15 border-2 border-glider-mint dark:border-glider-mint/30 flex items-center justify-center font-display text-2xl font-bold text-glider-olive dark:text-glider-mint overflow-hidden shadow-sm">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user.username.slice(0, 1).toUpperCase()
                  )}
                </div>
                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="input !py-1 text-lg font-bold w-full max-w-[200px]"
                      placeholder="Username"
                      autoFocus
                    />
                    <p className="text-xs text-glider-gray dark:text-glider-darkMuted">
                      {user.email}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h2 className="font-display text-2xl font-bold text-glider-black dark:text-glider-darkText">
                      {user.username}
                    </h2>
                    <p className="text-sm text-glider-gray dark:text-glider-darkMuted">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditUsername(user.username)
                      setEditAvatarUrl(user.avatarUrl || '')
                    }}
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="btn-primary text-xs py-1.5 px-4"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-glider-gray dark:text-glider-darkMuted hover:text-glider-black dark:hover:text-glider-darkText text-2xl leading-none w-8 h-8 rounded-full hover:bg-glider-light dark:hover:bg-glider-darkPanel2 flex items-center justify-center -mr-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
          
          {isEditing && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-semibold mb-1">
                  Avatar URL (Optional)
                </label>
                <input
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="input !py-1 text-xs w-full"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
          )}
        </div>

        {/* tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-glider-border dark:border-glider-darkBorder">
          {(['socials', 'history'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 pb-3 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t
                  ? 'border-glider-olive dark:border-glider-mint text-glider-olive dark:text-glider-mint'
                  : 'border-transparent text-glider-gray dark:text-glider-darkMuted hover:text-glider-black dark:hover:text-glider-darkText'
              }`}
            >
              {t === 'socials'
                ? 'Connected Socials'
                : `Notifications (${history.length})`}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {tab === 'socials' ? (
            <>
              {/* Global notification mute toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${notificationsMuted ? 'bg-red-500/10 border-red-500/30' : 'bg-glider-light dark:bg-glider-darkPanel2 border-glider-border dark:border-glider-darkBorder'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${notificationsMuted ? 'bg-red-500/20 text-red-400' : 'bg-glider-olive/20 dark:bg-glider-mint/15 text-glider-olive dark:text-glider-mint'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {notificationsMuted ? (
                        <>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          <path d="M18.63 13A17.89 17.89 0 0 1 18 8"/>
                          <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/>
                          <path d="M18 8a6 6 0 0 0-9.33-5"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </>
                      ) : (
                        <>
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </>
                      )}
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-glider-black dark:text-glider-darkText">
                      {notificationsMuted ? 'Notifications Muted' : 'Notifications Active'}
                    </div>
                    <div className="text-xs text-glider-gray dark:text-glider-darkMuted">
                      {notificationsMuted ? 'You won\'t receive any notifications.' : 'You\'ll receive notifications on connected platforms.'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotificationsMuted()}
                  className={`relative w-11 h-6 rounded-full transition-colors ${notificationsMuted ? 'bg-red-500/60' : 'bg-glider-olive dark:bg-glider-mint'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notificationsMuted ? 'left-0.5' : 'left-[22px]'}`} />
                </button>
              </div>

              <p className={`text-sm text-glider-gray dark:text-glider-darkMuted ${notificationsMuted ? 'opacity-50' : ''}`}>
                Connect your accounts to get notified across X, Telegram, and
                Discord when events you're tracking go live or are updated.
              </p>

              {user.isAdmin && (
                <label className="flex items-center gap-3 bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder rounded-xl p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={user.notifyAllLive || false}
                    onChange={() => toggleNotifyAllLive()}
                    className="w-4 h-4 accent-glider-olive"
                  />
                  <div>
                    <div className="font-semibold text-glider-black dark:text-glider-darkText text-sm">
                      Notify me when any event goes live
                    </div>
                    <div className="text-xs text-glider-gray dark:text-glider-darkMuted">
                      Get notified for all live events, not just ones you set reminders on
                    </div>
                  </div>
                </label>
              )}

              {platforms.map((p) => {
                const conn = user.socials[p.key]
                // Email is always rendered as connected, falling back to
                // the account email while the DB row is being created.
                const effectiveConn =
                  p.alwaysOn && !conn
                    ? {
                        handle: user.email,
                        connectedAt: user.createdAt,
                        notifications: true,
                        externalId: undefined,
                      }
                    : conn
                return (
                  <div
                    key={p.key}
                    className="bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${p.color}`}
                    >
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-glider-black dark:text-glider-darkText text-sm">
                        {p.name}
                      </div>
                      {effectiveConn ? (
                        <div className="text-xs text-glider-gray dark:text-glider-darkMuted truncate">
                          {p.alwaysOn ? (
                            <>
                              {effectiveConn.notifications ? 'Sending to' : 'Notifications off ·'}{' '}
                              <span className={`font-mono ${effectiveConn.notifications ? 'text-glider-olive dark:text-glider-mint' : 'text-glider-gray dark:text-glider-darkMuted'}`}>
                                {effectiveConn.handle}
                              </span>
                            </>
                          ) : (
                            <>
                              Connected as{' '}
                              <span className="font-mono text-glider-olive dark:text-glider-mint">
                                @{effectiveConn.handle}
                              </span>
                            </>
                          )}
                          {effectiveConn.externalId && (
                            <span className="ml-1 text-[10px] text-glider-mint">
                              · chat linked
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-glider-gray dark:text-glider-darkMuted">
                          {p.hint}
                        </div>
                      )}
                      {p.key === 'telegram' &&
                        telegramCode &&
                        telegramPolling && (
                          <div className="mt-2 text-xs text-glider-olive dark:text-glider-mint">
                            One-time code:{' '}
                            <span className="font-mono font-bold">
                              {telegramCode}
                            </span>
                            {telegramBotUsername ? (
                              <>
                                {' '}
                                — open{' '}
                                <a
                                  href={`https://t.me/${telegramBotUsername}?start=${telegramCode}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline"
                                >
                                  the Glider bot
                                </a>{' '}
                                and tap Start.
                              </>
                            ) : (
                              <>
                                {' '}
                                — DM the Glider bot{' '}
                                <code>/start {telegramCode}</code>.
                              </>
                            )}
                          </div>
                        )}
                    </div>

                    {effectiveConn ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSocialNotifications(p.key)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${effectiveConn.notifications ? 'bg-glider-olive dark:bg-glider-mint' : 'bg-gray-300 dark:bg-gray-600'}`}
                          title={effectiveConn.notifications ? 'Notifications on' : 'Notifications off'}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${effectiveConn.notifications ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                        {!p.alwaysOn && (
                          <button
                            type="button"
                            onClick={() => disconnectSocial(p.key)}
                            className="btn-ghost text-xs py-1.5 px-3"
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {p.key !== 'telegram' && (
                          <input
                            value={draftHandles[p.key] || ''}
                            onChange={(e) => setDraft(p.key, e.target.value)}
                            className="input !py-1.5 text-xs sm:w-44"
                            placeholder={p.placeholder}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleConnect(p.key)}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Connect
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          ) : (
            <>
              {history.length === 0 ? (
                <p className="text-sm text-glider-gray dark:text-glider-darkMuted text-center py-8">
                  No notifications yet. They'll show up here as events go live.
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((n) => (
                    <li
                      key={n.id}
                      className="bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-glider-black dark:text-glider-darkText truncate">
                          {n.title}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted">
                          {new Date(n.sentAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs text-glider-gray dark:text-glider-darkMuted mt-1">
                        {n.body}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-glider-olive dark:text-glider-mint mt-2">
                        Sent to {n.platforms.join(', ')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-glider-border dark:border-glider-darkBorder flex justify-between items-center">
          <span className="text-xs text-glider-gray dark:text-glider-darkMuted">
            {user.remindersFor.length} active reminder
            {user.remindersFor.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={async () => {
              await signOut()
              onClose()
            }}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
