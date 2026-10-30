const MASTER_VOLUME = 0.3
const FADE_STEP = 0.025
const FADE_INTERVAL_MS = 30

let soundtrack
let fadeTimer

function getSoundtrack() {
  if (typeof window === 'undefined') return null
  if (!soundtrack) {
    soundtrack = new Audio('/matchaudio.wav')
    soundtrack.loop = true
    soundtrack.preload = 'none'
    soundtrack.volume = 0
  }
  return soundtrack
}

function fadeTo(target, onComplete) {
  const audio = getSoundtrack()
  if (!audio) return
  window.clearInterval(fadeTimer)
  fadeTimer = window.setInterval(() => {
    const difference = target - audio.volume
    if (Math.abs(difference) <= FADE_STEP) {
      audio.volume = target
      window.clearInterval(fadeTimer)
      fadeTimer = undefined
      onComplete?.()
      return
    }
    audio.volume = Math.max(0, Math.min(1, audio.volume + Math.sign(difference) * FADE_STEP))
  }, FADE_INTERVAL_MS)
}

export async function startSoundtrack() {
  const audio = getSoundtrack()
  if (!audio) return false
  try {
    if (audio.paused) {
      audio.volume = 0
      await audio.play()
    }
    fadeTo(MASTER_VOLUME)
    return true
  } catch {
    return false
  }
}

export function stopSoundtrack() {
  if (!soundtrack) return
  const audio = soundtrack
  fadeTo(0, () => {
    audio.pause()
    audio.currentTime = 0
  })
}
