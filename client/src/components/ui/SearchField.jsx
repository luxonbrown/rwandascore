import { Search, X } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { cn } from '../../utils/cn'

export default function SearchField({
  value,
  onChange,
  placeholder,
  className,
  autoFocus = false,
  onSubmit,
}) {
  const { t } = useI18n()

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.(value)
      }}
      className={cn('relative', className)}
    >
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={placeholder || t('common.search')}
        className="input py-2.5 pl-9 pr-9 text-sm"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('common.clear')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-white"
        >
          <X size={15} />
        </button>
      ) : null}
    </form>
  )
}
