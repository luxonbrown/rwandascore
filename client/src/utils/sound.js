import { usePreferencesStore } from '../store/preferences'

let audioContext
const recentScoreSounds = new Map()

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  audioContext ||= new AudioContextClass()
  return audioContext
}

function playTone(context, frequency, startAt, duration, volume, type = 'sine') {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + duration + 0.02)
}

export function playSound(kind = 'tap', { force = false, dedupeKey } = {}) {
  if (!force && !usePreferencesStore.getState().soundEnabled) return
  if (typeof window === 'undefined') return
  if (dedupeKey) {
    const now = Date.now()
    if (recentScoreSounds.has(dedupeKey) && now - recentScoreSounds.get(dedupeKey) < 3000) return
    recentScoreSounds.set(dedupeKey, now)
    if (recentScoreSounds.size > 40) recentScoreSounds.delete(recentScoreSounds.keys().next().value)
  }

  try {
    const context = getAudioContext()
    if (!context) return
    if (context.state === 'suspended') void context.resume().catch(() => {})
    const at = context.currentTime + 0.01
    if (kind === 'goal') {
      playTone(context, 660, at, 0.22, 0.12, 'triangle')
      playTone(context, 880, at + 0.11, 0.25, 0.1, 'triangle')
      playTone(context, 1108.73, at + 0.22, 0.32, 0.1, 'sine')
    } else if (kind === 'toggle') {
      playTone(context, 620, at, 0.09, 0.055)
      playTone(context, 830, at + 0.08, 0.12, 0.06)
    } else {
      playTone(context, 520, at, 0.045, 0.025, 'sine')
    }
  } catch {
    // Audio feedback is optional; unsupported or blocked audio must not affect the UI.
  }
}
