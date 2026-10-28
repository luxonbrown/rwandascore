import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function SectionHeading({ title, href, linkLabel, action, className }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="section-title">{title}</h2>
      {action}
      {href && linkLabel ? (
        <Link
          to={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-accent"
        >
          {linkLabel}
          <ChevronRight size={14} />
        </Link>
      ) : null}
    </div>
  )
}
