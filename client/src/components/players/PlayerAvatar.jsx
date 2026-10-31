import { useState } from 'react'
import { playerPhotoUrl, initialsOf } from '../../utils/media'

export default function PlayerAvatar({ player, className = '', imageClassName = '', fallbackClassName = '', fallbackStyle, number, numberClassName = '' }) {
  const [failedUrl, setFailedUrl] = useState('')
  const photoUrl = playerPhotoUrl(player)
  const showPhoto = Boolean(photoUrl && photoUrl !== failedUrl)

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`} style={fallbackStyle}>
      <span className={`absolute inset-0 flex items-center justify-center ${fallbackClassName}`}>
        {initialsOf(player?.name || '')}
      </span>
      {showPhoto ? <img src={photoUrl} alt={player?.name || 'Player'} loading="lazy" className={`absolute inset-0 z-10 h-full w-full object-cover ${imageClassName}`} onError={() => setFailedUrl(photoUrl)} /> : null}
      {number !== undefined && number !== null ? <span className={`absolute bottom-0 right-0 z-20 rounded-full px-1 text-[9px] font-extrabold leading-4 shadow ${numberClassName}`}>{number}</span> : null}
    </span>
  )
}
