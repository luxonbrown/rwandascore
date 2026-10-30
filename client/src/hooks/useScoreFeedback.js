import { useEffect, useRef, useState } from 'react'
import { playSound } from '../utils/sound'

export function useScoreFeedback(match) {
  const score = `${match.homeScore ?? 0}-${match.awayScore ?? 0}`
  const previousScore = useRef(score)
  const [isCelebrating, setIsCelebrating] = useState(false)

  useEffect(() => {
    if (previousScore.current === score) return undefined
    previousScore.current = score
    setIsCelebrating(true)
    const timeout = window.setTimeout(() => setIsCelebrating(false), 900)
    playSound('goal', { dedupeKey: `${match.id}:${score}` })
    return () => window.clearTimeout(timeout)
  }, [match.id, score])

  return isCelebrating
}
