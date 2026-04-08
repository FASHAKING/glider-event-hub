import Logo from './Logo'

interface Props {
  /** Tailwind size classes for the icon, e.g. 'w-9 h-9' */
  iconClassName?: string
  /** Tailwind text size class for the wordmark, e.g. 'text-lg' */
  textClassName?: string
  /** Hide the "Event Hub" suffix and only show "Glider" */
  short?: boolean
}

/**
 * Wordmark = official Glider mark + "Glider Event Hub" wordmark.
 * Use this anywhere you'd previously written `<Logo /> Glider <span>Event Hub</span>`.
 */
export default function Wordmark({
  iconClassName = 'w-9 h-9',
  textClassName = 'text-lg',
  short = false,
}: Props) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Logo className={iconClassName} />
      <span
        className={`font-display font-bold tracking-tight text-glider-black dark:text-glider-darkText ${textClassName}`}
      >
        Glider
        {!short && (
          <span className="text-glider-olive dark:text-glider-mint"> Event Hub</span>
        )}
      </span>
    </span>
  )
}
