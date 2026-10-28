import { cn } from '../../utils/cn'

const tones = {
  W: 'bg-positive/15 text-positive',
  D: 'bg-white/10 text-muted',
  L: 'bg-negative/15 text-negative',
}

export default function FormBadges({ form = [], className, size = 'sm' }) {
  if (!form.length) return null
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={form.join(' ')}>
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={cn(
            'inline-flex items-center justify-center rounded font-bold',
            size === 'xs' ? 'h-4 w-4 text-[9px]' : 'h-5 w-5 text-[10px]',
            tones[result] || tones.D,
          )}
        >
          {result}
        </span>
      ))}
    </span>
  )
}
