import { cn } from '../../utils/cn'

export default function AdminPageHeader({ title, subtitle, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-4 border-b border-line bg-surface/40 px-4 py-6 sm:px-6 lg:px-8',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
