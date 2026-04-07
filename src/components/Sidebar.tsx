import { useState } from 'react'
import Logo from './Logo'

interface NavItem {
  label: string
  href: string
  external?: boolean
  icon: JSX.Element
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
  onSubmitClick: () => void
}

export default function Sidebar({ onSubmitClick }: Props) {
  const [open, setOpen] = useState(false)

  const items: NavItem[] = [
    { label: 'Home', href: '#', icon: HomeIcon },
    { label: 'Calendar', href: '#events', icon: CalIcon },
    { label: 'Leaderboard', href: '#leaderboard', icon: TrophyIcon },
    { label: 'Suggestions', href: '#about', icon: BulbIcon },
  ]
  const links: NavItem[] = [
    { label: 'Glider Discord', href: 'https://discord.gg/glider', external: true, icon: DiscordIcon },
    { label: 'Glider Website', href: 'https://glider.xyz', external: true, icon: GlobeIcon },
  ]

  return (
    <>
      {/* mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-glider-bg/85 backdrop-blur border-b border-glider-border px-4 py-3">
        <a href="#" className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-display font-bold text-glider-black">
            Glider <span className="text-glider-olive">Event Hub</span>
          </span>
        </a>
        <button
          onClick={() => setOpen(true)}
          className="text-glider-black p-1.5 rounded-lg hover:bg-glider-light"
          aria-label="Open menu"
        >
          {MenuIcon}
        </button>
      </div>

      {/* mobile drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-glider-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 z-50 bg-white border-r border-glider-border flex flex-col transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <a href="#" className="flex items-center gap-2.5">
            <Logo className="w-9 h-9" />
            <span className="font-display font-bold text-glider-black">
              Glider <span className="text-glider-olive">Hub</span>
            </span>
          </a>
          <button
            className="lg:hidden text-glider-gray p-1.5 rounded-lg hover:bg-glider-light"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            {CloseIcon}
          </button>
        </div>

        <nav className="px-3 flex-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-glider-gray/70">
            Explore
          </p>
          <ul className="space-y-0.5 mb-4">
            {items.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-glider-gray hover:bg-glider-light hover:text-glider-black transition"
                >
                  <span className="text-glider-olive">{item.icon}</span>
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  onSubmitClick()
                  setOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-glider-gray hover:bg-glider-light hover:text-glider-black transition"
              >
                <span className="text-glider-olive">{SendIcon}</span>
                Submit Event
              </button>
            </li>
          </ul>

          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-glider-gray/70">
            Community
          </p>
          <ul className="space-y-0.5">
            {links.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noreferrer' : undefined}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-glider-gray hover:bg-glider-light hover:text-glider-black transition"
                >
                  <span className="text-glider-olive">{item.icon}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-glider-border">
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
