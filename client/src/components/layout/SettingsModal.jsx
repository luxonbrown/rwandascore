import { useState } from 'react'
import { Check, Globe2, Star } from 'lucide-react'
import Modal from '../ui/Modal'
import { useI18n } from '../../hooks/useI18n'
import { useUiStore } from '../../store/ui'
import { usePreferencesStore } from '../../store/preferences'
import { cn } from '../../utils/cn'

export default function SettingsModal() {
  const { t, language, setLanguage, languages } = useI18n()
  const open = useUiStore((state) => state.settingsOpen)
  const close = useUiStore((state) => state.closeSettings)
  const pushToast = useUiStore((state) => state.pushToast)
  const favouriteTeams = usePreferencesStore((state) => state.favouriteTeams)
  const favouritePlayers = usePreferencesStore((state) => state.favouritePlayers)
  const clearFavourites = usePreferencesStore((state) => state.clearFavourites)
  const [confirming, setConfirming] = useState(false)

  const count = favouriteTeams.length + favouritePlayers.length

  const handleClear = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    clearFavourites()
    setConfirming(false)
    pushToast(t('settings.resetFavourites'), 'info')
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setConfirming(false)
        close()
      }}
      title={t('settings.title')}
      description={t('settings.languageBody')}
      size="md"
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            <Globe2 size={14} />
            {t('settings.language')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                aria-pressed={language === item.code}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                  language === item.code
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-line bg-surface2 text-white hover:border-white/20',
                )}
              >
                {item.label}
                {language === item.code ? <Check size={15} /> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface2/60 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Star size={15} className="text-accent" />
                {t('nav.favourites')}
              </h3>
              <p className="mt-1 text-xs text-muted">{t('settings.favouritesBody')}</p>
            </div>
            {count ? (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                {count}
              </span>
            ) : null}
          </div>
          {count ? (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'mt-3 text-xs font-semibold',
                confirming ? 'text-negative' : 'text-muted hover:text-white',
              )}
            >
              {confirming ? t('common.confirm') : t('settings.resetFavourites')}
            </button>
          ) : null}
        </section>

        <p className="text-[11px] leading-relaxed text-muted">{t('settings.dataBody')}</p>
      </div>
    </Modal>
  )
}
