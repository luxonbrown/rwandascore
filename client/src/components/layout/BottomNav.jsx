import { NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, House, Menu, Newspaper, Radio } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { useUiStore } from '../../store/ui'
import { cn } from '../../utils/cn'

const items = [
  { to: '/', key: 'nav.home', icon: House, end: true },
  { to: '/live', key: 'nav.live', icon: Radio, live: true },
  { to: '/fixtures', key: 'nav.fixtures', icon: CalendarDays },
  { to: '/news', key: 'nav.news', icon: Newspaper },
]

export default function BottomNav() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const openMobileMore = useUiStore((state) => state.openMobileMore)

  const moreActive =
    !['/', '/live', '/fixtures', '/news', '/search'].includes(pathname) &&
    ['/results', '/competitions', '/teams', '/players', '/favourites', '/tables'].some((path) =>
      pathname.startsWith(path),
    )

  return (
    <nav
      aria-label={t('nav.menu')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors',
                  isActive ? 'text-accent' : 'text-muted hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  <span>{t(item.key)}</span>
                  {item.live ? (
                    <span className="absolute right-[30%] top-2 h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : null}
                  {isActive ? (
                    <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent" />
                  ) : null}
                </>
              )}
            </NavLink>
          )
        })}
        <button
          type="button"
          onClick={openMobileMore}
          aria-pressed={moreActive}
          className={cn(
            'flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors',
            moreActive ? 'text-accent' : 'text-muted hover:text-white',
          )}
        >
          <Menu size={20} />
          <span>{t('nav.more')}</span>
        </button>
      </div>
    </nav>
  )
}
