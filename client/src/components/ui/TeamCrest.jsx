import { cn } from '../../utils/cn'
import { initialsOf } from '../../utils/media'

const sizes = {
  xs: 'h-5 w-[18px]',
  sm: 'h-7 w-[26px]',
  md: 'h-9 w-8',
  lg: 'h-14 w-[52px]',
  xl: 'h-20 w-[74px]',
}

export default function TeamCrest({ team, size = 'md', className, decorative = true }) {
  const primary = team?.colors?.primary || '#3A3A3A'
  const secondary = team?.colors?.secondary || '#FFFFFF'
  const initials = team?.initials || initialsOf(team?.name || '')
  const label = team?.name || 'Team'

  return (
    <svg
      viewBox="0 0 48 52"
      className={cn('shrink-0 drop-shadow-sm', sizes[size] || sizes.md, className)}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      <path d="M4 2h40v25.5C44 40.5 34.8 46.6 24 50 13.2 46.6 4 40.5 4 27.5V2Z" fill={primary} />
      <path
        d="M4 2h40v6H4z"
        fill={secondary}
        opacity="0.92"
      />
      <path
        d="M4 2h40v25.5C44 40.5 34.8 46.6 24 50 13.2 46.6 4 40.5 4 27.5V2Z"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
      />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fill={secondary}
        fontSize="12.5"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="0.2"
      >
        {initials.slice(0, 3)}
      </text>
    </svg>
  )
}
