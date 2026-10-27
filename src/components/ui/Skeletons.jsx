import { cn } from '../../utils/cn'

export function Bar({ className }) {
  return <span className={cn('skeleton block h-3 rounded', className)} />
}

export function MatchListSkeleton({ count = 5, className }) {
  return (
    <div className={cn('divide-y divide-line', className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-4">
          <Bar className="ml-auto w-24" />
          <Bar className="h-7 w-7 rounded-full" />
          <Bar className="w-12" />
          <Bar className="h-7 w-7 rounded-full" />
          <Bar className="mr-auto w-24" />
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({ count = 4, className }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card space-y-3 p-4">
          <div className="flex items-center gap-3">
            <span className="skeleton h-10 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Bar className="w-3/4" />
              <Bar className="w-1/2" />
            </div>
          </div>
          <Bar className="h-2 w-full" />
          <Bar className="w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function ArticleGridSkeleton({ count = 3, className }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card overflow-hidden">
          <span className="skeleton block aspect-[16/9] w-full" />
          <div className="space-y-2.5 p-4">
            <Bar className="w-1/3" />
            <Bar className="h-4 w-full" />
            <Bar className="w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
