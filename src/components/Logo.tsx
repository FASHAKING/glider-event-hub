interface Props {
  className?: string
  /** Use the mint rounded-square app icon instead of the bare wing mark */
  variant?: 'mark' | 'icon'
}

export default function Logo({ className = 'w-9 h-9', variant = 'icon' }: Props) {
  const src =
    variant === 'icon' ? '/brand/glider-icon-mint.png' : '/brand/glider-mark-black.png'
  return (
    <img
      src={src}
      alt="Glider"
      className={className}
      width={40}
      height={40}
      decoding="async"
    />
  )
}
