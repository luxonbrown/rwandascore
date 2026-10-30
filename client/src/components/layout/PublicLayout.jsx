import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import SettingsModal from './SettingsModal'
import MobileMoreSheet from './MobileMoreSheet'
import ScrollToTop from './ScrollToTop'
import { useI18n } from '../../hooks/useI18n'
import { usePreferencesStore } from '../../store/preferences'
import { startSoundtrack, stopSoundtrack } from '../../utils/soundtrack'

export default function PublicLayout() {
  const { t } = useI18n()
  const soundEnabled = usePreferencesStore((state) => state.soundEnabled)

  useEffect(() => {
    if (soundEnabled) void startSoundtrack()
    else stopSoundtrack()
  }, [soundEnabled])

  useEffect(() => () => stopSoundtrack(), [])

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <ScrollToTop />
      <a
        href="#main-content"
        className="sr-only z-[110] rounded-md bg-accent px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main-content" className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <SettingsModal />
      <MobileMoreSheet />
    </div>
  )
}
