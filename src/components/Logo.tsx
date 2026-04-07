export default function Logo({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Glider"
    >
      <defs>
        <linearGradient id="glider-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A8E0D1" />
          <stop offset="55%" stopColor="#4F7F58" />
          <stop offset="100%" stopColor="#A3C8E0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#glider-g)" />
      {/* paper-plane / glider mark */}
      <path
        d="M11 22.5L28.5 12.2c.7-.4 1.5.3 1.2 1.1L24.2 28c-.3.8-1.4.9-1.8.1l-2.9-5.5-5.6-2.8c-.8-.4-.8-1.6.1-1.9z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M20 22l5-5"
        stroke="#4F7F58"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
