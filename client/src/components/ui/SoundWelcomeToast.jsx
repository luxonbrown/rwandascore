import { useEffect, useState } from 'react'
import { Music2, Volume2, VolumeX } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { usePreferencesStore } from '../../store/preferences'
import { playSound } from '../../utils/sound'

const PROMPT_KEY = 'rwandascore_sound_prompt_seen_v1'

export default function SoundWelcomeToast() {
  const { t } = useI18n()
  const soundEnabled = usePreferencesStore((state) => state.soundEnabled)
  const setSoundEnabled = usePreferencesStore((state) => state.setSoundEnabled)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.sessionStorage.getItem(PROMPT_KEY)) return undefined
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(PROMPT_KEY, '1')
      setVisible(true)
    }, 1100)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  const close = () => setVisible(false)
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
    if (!soundEnabled) playSound('toggle', { force: true })
  }

  return (
    <aside className="sound-welcome-toast" role="status" aria-live="polite">
      <span className="sound-welcome-icon"><Music2 size={19} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-white">{t(soundEnabled ? 'soundPrompt.enabledTitle' : 'soundPrompt.title')}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">{t(soundEnabled ? 'soundPrompt.enabledBody' : 'soundPrompt.body')}</p>
      </div>
      <button type="button" onClick={toggleSound} className="sound-welcome-action" aria-label={t(soundEnabled ? 'settings.soundOff' : 'soundPrompt.enable')}>
        {soundEnabled ? <VolumeX size={16} /> : <Volume2 size={16} />}
        <span>{t(soundEnabled ? 'soundPrompt.turnOff' : 'soundPrompt.enable')}</span>
      </button>
      <button type="button" onClick={close} className="sound-welcome-later">{t('soundPrompt.later')}</button>
    </aside>
  )
}
