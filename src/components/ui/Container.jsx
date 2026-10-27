import { cn } from '../../utils/cn'

export default function Container({ className, children }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}
