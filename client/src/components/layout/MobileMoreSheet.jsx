import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronRight,
  Search,
  Settings,
  Shield,
  Star,
  Table2,
  Trophy,
  Users,
} from 'lucide-react'
import Modal from '../ui/Modal'
import { mobileMoreLinks } from '../../config'
import { useI18n } from '../../hooks/useI18n'
import { useUiStore } from '../../store/ui'
import { usePreferencesStore } from '../../store/preferences'

const icons = {
  'nav.fixtures': CalendarDays,
  'nav.results': Trophy,
  'nav.competitions': Trophy,
  'nav.teams': Shield,
  'nav.players': Users,
  'nav.favourites': Star,
  'nav.tables': Table2,
  'nav.search': Search,
}

export default function MobileMoreSheet() {
  const { t } = useI18n()
  const open = useUiStore((state) => state.mobileMoreOpen)
  const close = useUiStore((state) => state.closeMobileMore)
  const openSettings = useUiStore((state) => state.openSettings)
  const favouriteTeams = usePreferencesStore((state) => state.favouriteTeams)
  const favouritePlayers = usePreferencesStore((state) => state.favouritePlayers)

  const handleSettings = () => {
    close()
    openSettings()
  }

  return (
    <Modal open={open} onClose={close} title={t('nav.moreTitle')} size="md">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {mobileMoreLinks.map((link) => {
          const Icon = icons[link.key] || ChevronRight
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg border border-line bg-surface2 px-3 py-3 text-sm font-semibold text-white transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Icon size={17} className="text-muted" />
              <span className="truncate">{t(link.key)}</span>
              {link.key === 'nav.favourites' && favouriteTeams.length + favouritePlayers.length ? (
                <span className="ml-auto rounded-full bg-accent/15 px-1.5 text-[10px] font-bold text-accent">
                  {favouriteTeams.length + favouritePlayers.length}
                </span>
              ) : null}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={handleSettings}
          className="flex items-center gap-2.5 rounded-lg border border-line bg-surface2 px-3 py-3 text-sm font-semibold text-white transition-colors hover:border-accent/40 hover:text-accent"
        >
          <Settings size={17} className="text-muted" />
          {t('settings.title')}
        </button>
      </div>
    </Modal>
  )
}
