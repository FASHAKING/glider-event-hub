import { useTheme } from '../hooks/useTheme'

interface Props {
  /** "pill" → wide pill with both icons + label, "icon" → square icon button */
  variant?: 'pill' | 'icon'
  className?: string
}

const SunIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

const MoonIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
  </svg>
)

export default function ThemeToggle({ variant = 'pill', className = '' }: Props) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`relative w-9 h-9 inline-flex items-center justify-center rounded-xl
          bg-white border border-glider-border text-glider-gray hover:text-glider-olive hover:border-glider-olive/40
          dark:bg-glider-darkPanel dark:border-glider-darkBorder dark:text-glider-darkMuted dark:hover:text-glider-mint dark:hover:border-glider-mint/40
          transition-all ${className}`}
      >
        <span className={`absolute transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
          {SunIcon}
        </span>
        <span className={`absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
          {MoonIcon}
        </span>
      </button>
    )
  }

  // pill variant: animated track with sliding thumb
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        bg-glider-light dark:bg-glider-darkPanel2
        border border-glider-border dark:border-glider-darkBorder
        text-sm font-medium text-glider-gray dark:text-glider-darkMuted
        hover:text-glider-black dark:hover:text-glider-darkText
        transition-all group ${className}`}
    >
      {/* track with sliding thumb */}
      <span className="relative inline-flex w-12 h-6 rounded-full bg-white dark:bg-glider-darkBg border border-glider-border dark:border-glider-darkBorder shrink-0">
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center
            ${isDark
              ? 'left-[calc(100%-1.375rem)] bg-glider-mint text-glider-darkBg shadow-glowMint'
              : 'left-0.5 bg-glider-olive text-white shadow-sm'
            }`}
        >
          <span className={`transition-all duration-300 ${isDark ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}>
            {SunIcon}
          </span>
          <span className={`absolute transition-all duration-300 ${isDark ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
            {MoonIcon}
          </span>
        </span>
      </span>
      {isDark ? 'Dark Mode' : 'Light Mode'}
    </button>
  )
}
