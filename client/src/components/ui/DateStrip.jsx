import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { addDays, dayKeyOf, formatDate, todayKey } from '../../utils/format'
import { cn } from '../../utils/cn'

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

export default function DateStrip({ selectedDate, onSelect, days = 7, className }) {
  const { t } = useI18n()
  const date = selectedDate || new Date()
  const half = Math.floor(days / 2)
  const dates = Array.from({ length: days }, (_, index) => addDays(date, index - half))

  return (
    <div className={cn('', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{formatDate(date)}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelect(addDays(date, -1))}
            aria-label={t('common.previous')}
            className="btn btn-ghost p-1.5"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            onClick={() => onSelect(addDays(date, 1))}
            aria-label={t('common.next')}
            className="btn btn-ghost p-1.5"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {dates.map((item) => {
          const selected = dayKeyOf(item) === dayKeyOf(date)
          const isToday = dayKeyOf(item) === todayKey()
          return (
            <button
              key={dayKeyOf(item)}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(item)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 transition-colors',
                selected
                  ? 'border-accent bg-accent text-ink'
                  : 'border-line bg-surface text-muted hover:border-white/20 hover:text-white',
              )}
            >
              <span className="text-[9px] font-semibold uppercase">
                {isToday ? t('common.today').slice(0, 3) : weekday.format(item).slice(0, 3)}
              </span>
              <span className="text-sm font-extrabold">{item.getDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
