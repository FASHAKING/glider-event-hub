import type { GliderEvent } from '../types'
import { ExternalIcon, LiveDotIcon } from './Icons'

interface Props {
  event: GliderEvent
}

export default function LiveBanner({ event }: Props) {
  return (
    <div className="bg-gradient-to-r from-glider-mint via-white to-glider-sky border-b border-glider-border">
      <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center justify-center gap-3 flex-wrap text-sm">
        <span className="chip border-red-300 bg-red-50 text-red-600">
          <LiveDotIcon width={12} height={12} className="animate-pulse" />
          HAPPENING NOW
        </span>
        <span className="font-display font-semibold text-glider-black truncate">
          {event.title}
        </span>
        {event.location && (
          <span className="text-glider-gray hidden sm:inline">
            · {event.location}
          </span>
        )}
        <a
          href={event.link}
          target="_blank"
          rel="noreferrer"
          className="ml-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-glider-olive text-white text-xs font-semibold hover:bg-glider-olive/90 transition"
        >
          Join
          <ExternalIcon width={12} height={12} />
        </a>
      </div>
    </div>
  )
}
