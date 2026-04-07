import type { SVGProps } from 'react'
import type { EventCategory } from '../types'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const CalendarIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const UserIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
  </svg>
)

export const PinIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
)

export const SearchIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)

export const SendIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
)

export const GridIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

export const ListIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
)

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const PlusIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const SparkleIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
  </svg>
)

export const ExternalIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M20 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h5" />
  </svg>
)

export const LiveDotIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="8" opacity="0.35" />
  </svg>
)

// Category icons
const AMAIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 6h16v10H8l-4 4V6z" />
    <path d="M9 11h.01M12 11h.01M15 11h.01" />
  </svg>
)

const QuizIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 115 0c0 1.5-2.5 2-2.5 4" />
    <circle cx="12" cy="17" r="0.8" fill="currentColor" />
  </svg>
)

const WorkshopIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M14 7l3-3 3 3-3 3z" />
    <path d="M5 20l9-9" />
    <path d="M11 5l3 3" />
  </svg>
)

const MeetupIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="9" r="3" />
    <circle cx="17" cy="10" r="2.5" />
    <path d="M3 20c.8-3 3.3-5 6-5s5.2 2 6 5" />
    <path d="M15 18c.5-2 1.8-3 3.5-3s2.5 1 3 3" />
  </svg>
)

const HackathonIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 8l-4 4 4 4" />
    <path d="M17 8l4 4-4 4" />
    <path d="M14 5l-4 14" />
  </svg>
)

const LaunchIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4.5 16.5l3 3M5 14l5 5" />
    <path d="M14 4c4 0 6 2 6 6-2 3-5 6-9 8l-5-5c2-4 5-7 8-9z" />
    <circle cx="15" cy="9" r="1.5" />
  </svg>
)

export const CategoryIcon: Record<
  EventCategory,
  (p: IconProps) => JSX.Element
> = {
  AMA: AMAIcon,
  Quiz: QuizIcon,
  Workshop: WorkshopIcon,
  Meetup: MeetupIcon,
  Hackathon: HackathonIcon,
  Launch: LaunchIcon,
}
