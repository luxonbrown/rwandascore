import { Link, NavLink } from 'react-router-dom'
import { Search, Settings } from 'lucide-react'
import Container from '../ui/Container'
import { navLinks } from '../../config'
import { useI18n } from '../../hooks/useI18n'
import { useUiStore } from '../../store/ui'
import SoundToggle from '../ui/SoundToggle'
import { cn } from '../../utils/cn'

export default function Header() {
  const { t } = useI18n()
  const openSettings = useUiStore((state) => state.openSettings)

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/85">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label={t('nav.home')}>
          <img src="/logo.webp" alt="RwandaScore" className="h-10 w-[150px] object-contain object-left" />
        </Link>

        <nav aria-label={t('nav.menu')} className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-semibold transition-colors',
                  isActive ? 'text-white' : 'text-muted hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.key === 'nav.live' ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : null}
                  {t(link.key)}
                  {isActive ? (
                    <span className="nav-indicator absolute inset-x-2.5 -bottom-[11px] h-0.5 rounded-full bg-accent" />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <SoundToggle />
          <Link
            to="/search"
            aria-label={t('nav.search')}
            className="btn btn-ghost p-2"
          >
            <Search size={18} />
          </Link>
          <button
            type="button"
            onClick={openSettings}
            aria-label={t('settings.title')}
            className="btn btn-ghost p-2"
          >
            <Settings size={18} />
          </button>
        </div>
      </Container>
    </header>
  )
}
