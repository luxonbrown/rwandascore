import { useEffect } from 'react'
import { playSound } from '../../utils/sound'

export default function AudioFeedback() {
  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target instanceof Element ? event.target : null
      const control = target?.closest('a, button, [role="button"]')
      if (control && control.dataset.sound !== 'off') playSound('tap')
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return null
}
