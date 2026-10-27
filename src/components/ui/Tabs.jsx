import { cn } from '../../utils/cn'

export default function Tabs({ items = [], value, onChange, className, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('-mb-px flex gap-1 overflow-x-auto border-b border-line', className)}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative shrink-0 px-3 py-3 text-xs font-semibold transition-colors sm:px-4',
              active ? 'text-white' : 'text-muted hover:text-white',
            )}
          >
            {item.label}
            {item.count != null ? (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                  active ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted',
                )}
              >
                {item.count}
              </span>
            ) : null}
            {active ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
