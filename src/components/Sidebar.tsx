import { useState } from 'react'
import Wordmark from './Wordmark'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'
import type { AppView } from '../App'

interface NavItem {
  label: string
  href?: string
  external?: boolean
  icon: JSX.Element
  /** Which in-app view this item maps to. Undefined = anchor scroll. */
  view?: AppView
  action?: 'suggestion'
}

const HomeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
)
const CalIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </svg>
)
const TrophyIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
    <path d="M17 6h3v2a3 3 0 01-3 3M7 6H4v2a3 3 0 003 3" />
  </svg>
)
const BulbIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 22h4" />
    <path d="M12 2a7 7 0 00-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0012 2z" />
  </svg>
)
const SendIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
)
const GlobeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
  </svg>
)
const DiscordIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.3 5.3A17 17 0 0015 4l-.2.4a15 15 0 00-5.6 0L9 4a17 17 0 00-4.3 1.3A18 18 0 002 16a17 17 0 005.2 2.6l.5-.7c-.9-.3-1.7-.8-2.5-1.3l.6-.4a12 12 0 0012.4 0l.6.4c-.7.5-1.6 1-2.5 1.3l.5.7A17 17 0 0022 16a18 18 0 00-2.7-10.7zM9 14.5c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8c1 0 1.7.8 1.6 1.8 0 1-.7 1.8-1.6 1.8zm6 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8c1 0 1.7.8 1.6 1.8 0 1-.7 1.8-1.6 1.8z" />
  </svg>
)
const XIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.844l-5.36-7.01L4.6 22H1.34l8.022-9.166L1.5 2h7.02l4.844 6.4L18.244 2zm-1.2 18h1.86L7.04 4H5.05l11.994 16z" />
  </svg>
)
const MenuIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
)
const CloseIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6l-12 12" />
  </svg>
)

interface Props {
  view: AppView
  onNavigate: (view: AppView) => void
  onSubmitClick: () => void
  onSuggestionClick: () => void
  onSignInClick: () => void
  onSignUpClick: () => void
  onProfileClick: () => void
}

const UserCircleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6 19c1.5-2.5 3.5-4 6-4s4.5 1.5 6 4" />
  </svg>
)

const SignInIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
)

const navLinkBase =
  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition'

const navLinkInactive =
  'text-glider-gray dark:text-glider-darkMuted ' +
  'hover:bg-glider-light/80 dark:hover:bg-white/5 ' +
  'hover:text-glider-black dark:hover:text-glider-darkText'

const navLinkActive =
  'bg-glider-mint/20 dark:bg-glider-mint/10 ' +
  'text-glider-olive dark:text-glider-mint font-semibold ' +
  'ring-1 ring-inset ring-glider-mint/50 dark:ring-glider-mint/20 shadow-[inset_0_0_20px_rgba(168,224,209,0.15)] dark:shadow-[inset_0_0_20px_rgba(168,224,209,0.05)]'

const navLink = `${navLinkBase} ${navLinkInactive}`

const navIcon = 'text-glider-olive dark:text-glider-mint'

const sectionLabel =
  'px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider ' +
  'text-glider-gray/70 dark:text-glider-darkMuted/70'

export default function Sidebar({
  view,
  onNavigate,
  onSubmitClick,
  onSuggestionClick,
  onSignInClick,
  onSignUpClick,
  onProfileClick,
}: Props) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const items: NavItem[] = [
    { label: 'Home', href: '#', icon: HomeIcon, view: 'home' },
    { label: 'Calendar', href: '#calendar', icon: CalIcon, view: 'calendar' },
    { label: 'Leaderboard', href: '#leaderboard', icon: TrophyIcon, view: 'leaderboard' },
    { label: 'Suggestions', icon: BulbIcon, action: 'suggestion' },
  ]
  const links: NavItem[] = [
    { label: 'Glider Discord', href: 'https://discord.gg/xDy7M6xNPR', external: true, icon: DiscordIcon },
    { label: 'Glider on X', href: 'https://x.com/glider_fi', external: true, icon: XIcon },
    { label: 'Glider Website', href: 'https://glider.fi/r/v9t1x8jy', external: true, icon: GlobeIcon },
  ]

  return (
    <>
      {/* mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-xl border-b border-glider-border dark:border-white/10 px-4 py-3">
        <a href="#" className="flex items-center">
          <Wordmark iconClassName="w-8 h-8" textClassName="text-base" />
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          {user ? (
            <button
              onClick={onProfileClick}
              aria-label="Open profile"
              className="w-9 h-9 rounded-full bg-glider-mint/40 dark:bg-glider-mint/15 border border-glider-mint dark:border-glider-mint/30 flex items-center justify-center font-display text-sm font-bold text-glider-olive dark:text-glider-mint overflow-hidden shadow-sm"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                user.username.slice(0, 1).toUpperCase()
              )}
            </button>
          ) : (
            <button
              onClick={onSignInClick}
              aria-label="Sign in"
              className="text-glider-black dark:text-glider-darkText p-1.5 rounded-lg hover:bg-glider-light dark:hover:bg-glider-darkPanel2"
            >
              {SignInIcon}
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            className="text-glider-black dark:text-glider-darkText p-1.5 rounded-lg hover:bg-glider-light dark:hover:bg-glider-darkPanel2"
            aria-label="Open menu"
          >
            {MenuIcon}
          </button>
        </div>
      </div>

      {/* mobile drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-glider-black/40 dark:bg-glider-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 z-50 flex flex-col transition-transform duration-300
          bg-white/95 dark:bg-black/60 backdrop-blur-2xl
          border-r border-glider-border dark:border-white/5
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <a href="#" className="flex items-center">
            <Wordmark iconClassName="w-9 h-9" textClassName="text-base" />
          </a>
          <button
            className="lg:hidden text-glider-gray dark:text-glider-darkMuted p-1.5 rounded-lg hover:bg-glider-light dark:hover:bg-glider-darkPanel2"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            {CloseIcon}
          </button>
        </div>

        <nav className="px-3 flex-1 overflow-y-auto">
          <p className={sectionLabel}>Explore</p>
          <ul className="space-y-0.5 mb-4">
            {items.map((item) => {
              const isActive = !!item.view && item.view === view
              const className = `${navLinkBase} ${
                isActive ? navLinkActive : navLinkInactive
              }`
              if (item.action === 'suggestion') {
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => {
                        onSuggestionClick()
                        setOpen(false)
                      }}
                      className={`w-full ${className} text-left`}
                    >
                      <span className={navIcon}>{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                )
              }
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => {
                      if (item.view) {
                        e.preventDefault()
                        onNavigate(item.view)
                      }
                      setOpen(false)
                    }}
                    className={className}
                  >
                    <span className={navIcon}>{item.icon}</span>
                    {item.label}
                  </a>
                </li>
              )
            })}
            <li>
              <button
                onClick={() => {
                  onSubmitClick()
                  setOpen(false)
                }}
                className={`w-full ${navLink}`}
              >
                <span className={navIcon}>{SendIcon}</span>
                Submit Event
              </button>
            </li>
          </ul>

          <p className={sectionLabel}>Community</p>
          <ul className="space-y-0.5">
            {links.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noreferrer' : undefined}
                  className={navLink}
                >
                  <span className={navIcon}>{item.icon}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-glider-border dark:border-glider-darkBorder space-y-3">
          <ThemeToggle variant="pill" />

          {user ? (
            <button
              onClick={() => {
                onProfileClick()
                setOpen(false)
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder hover:border-glider-olive/40 dark:hover:border-glider-mint/40 transition text-left"
            >
              <div className="w-9 h-9 rounded-full bg-glider-mint/40 dark:bg-glider-mint/15 border border-glider-mint dark:border-glider-mint/30 flex items-center justify-center font-display text-sm font-bold text-glider-olive dark:text-glider-mint shrink-0 overflow-hidden shadow-sm">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  user.username.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-glider-black dark:text-glider-darkText truncate">
                  {user.username}
                </div>
                <div className="text-[10px] text-glider-gray dark:text-glider-darkMuted uppercase tracking-wider">
                  {Object.keys(user.socials).length} social
                  {Object.keys(user.socials).length === 1 ? '' : 's'} connected
                </div>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSignInClick()
                  setOpen(false)
                }}
                className="btn-ghost text-xs py-2 px-2"
              >
                {SignInIcon}
                Sign in
              </button>
              <button
                onClick={() => {
                  onSignUpClick()
                  setOpen(false)
                }}
                className="btn-soft text-xs py-2 px-2"
              >
                {UserCircleIcon}
                Sign up
              </button>
            </div>
          )}

          <button
            onClick={() => {
              onSubmitClick()
              setOpen(false)
            }}
            className="btn-primary w-full text-sm"
          >
            {SendIcon}
            Submit Your Event
          </button>
        </div>
      </aside>
    </>
  )
}
