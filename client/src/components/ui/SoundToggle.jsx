import { Volume2, VolumeX } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { usePreferencesStore } from '../../store/preferences'
import { playSound } from '../../utils/sound'
import { cn } from '../../utils/cn'

export default function SoundToggle({ showLabel = false }) {
  const { t } = useI18n()
  const soundEnabled = usePreferencesStore((state) => state.soundEnabled)
  const toggleSound = usePreferencesStore((state) => state.toggleSound)
  const label = soundEnabled ? t('settings.soundOff') : t('settings.soundOn')

  return <button type="button" data-sound="off" onClick={() => { toggleSound(); if (!soundEnabled) playSound('toggle', { force: true }) }} aria-label={label} aria-pressed={soundEnabled} title={label} className={cn('btn btn-ghost p-2', showLabel && 'w-full justify-start px-3', soundEnabled && 'text-accent')}>
    {soundEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}{showLabel ? <span className="text-xs">{label}</span> : null}
  </button>
}
