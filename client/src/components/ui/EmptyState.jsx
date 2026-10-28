import { Inbox } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function EmptyState({ icon: Icon = Inbox, title, body, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-surface/50 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface2 text-muted">
        <Icon size={22} />
      </span>
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        {body ? <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  )
}
