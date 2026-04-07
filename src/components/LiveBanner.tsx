import type { GliderEvent } from '../types'
import { ExternalIcon, LiveDotIcon } from './Icons'

interface Props {
  event: GliderEvent
}

export default function LiveBanner({ event }: Props) {
  return (
    <div className="bg-gradient-to-r from-glider-mint via-white to-glider-sky dark:from-glider-olive/40 dark:via-glider-darkPanel dark:to-glider-sky/30 border-b border-glider-border dark:border-glider-darkBorder">
      <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center justify-center gap-3 flex-wrap text-sm">
        <span className="chip border-red-300 bg-red-50 text-red-600 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300">
          <LiveDotIcon width={12} height={12} className="animate-pulse" />
          HAPPENING NOW
        </span>
        <span className="font-display font-semibold text-glider-black dark:text-glider-darkText truncate">
          {event.title}
        </span>
        {event.location && (
          <span className="text-glider-gray dark:text-glider-darkMuted hidden sm:inline">
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
