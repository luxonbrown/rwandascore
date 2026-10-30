import { useState } from 'react'
import { Link } from 'react-router-dom'
import TeamCrest from '../ui/TeamCrest'
import { useI18n } from '../../hooks/useI18n'
import { positionKey } from '../../utils/media'

const laneX = { GK: 8, DF: 29, MF: 53, FW: 78 }
const positionOrder = ['GK', 'DF', 'MF', 'FW']

function Marker({ player, team, top, featured = false, delay = 0 }) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const primary = team?.colors?.primary || '#ff6b00'
  const secondary = team?.colors?.secondary || '#ffffff'
  const label = `${player.name}, ${player.position}, ${team?.name || 'unassigned'}`
  return (
    <Link
      to={`/players/${player.id}`}
      title={label}
      aria-label={`Open ${player.name} profile. ${player.position} position.`}
      className={`pitch-player${featured ? ' pitch-player-featured' : ''}`}
      style={{ left: `${laneX[player.position] ?? 53}%`, top: `${top}%`, animationDelay: `${delay}ms`, '--marker-color': primary, '--marker-ink': secondary }}
    >
      {player.photoUrl && !photoFailed ? <img className="pitch-player-photo" src={player.photoUrl} alt="" loading="lazy" onError={() => setPhotoFailed(true)} /> : <span className="pitch-player-number">{player.number ?? '—'}</span>}
      {player.photoUrl && !photoFailed ? <span className="pitch-player-photo-number">#{player.number ?? '—'}</span> : null}
      <span className="pitch-player-name">{player.name}</span>
      <span className="pitch-player-position">{player.position}</span>
    </Link>
  )
}

export default function PlayerPitch({ players = [], team, featuredPlayer, title = 'Squad pitch', compact = false }) {
  const { t } = useI18n()
  const lineup = featuredPlayer ? [featuredPlayer] : players
  const markers = featuredPlayer
    ? [{ player: featuredPlayer, top: 50 }]
    : positionOrder.flatMap((position) => {
      const group = lineup.filter((player) => player.position === position)
      return group.map((player, index) => ({
        player,
        top: group.length < 2 ? 50 : 12 + (index * 76) / (group.length - 1),
      }))
    })
  const maxPlayersInLine = Math.max(1, ...positionOrder.map((position) => lineup.filter((player) => player.position === position).length))
  const stageHeight = compact ? 320 : Math.max(450, maxPlayersInLine * 62 + 110)

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="font-bold text-white">{title}</h2>
          <p className="mt-1 text-xs text-muted">{featuredPlayer ? t('players.pitchPositionHint') : t('players.pitchSquadHint')}</p>
        </div>
        {team ? <div className="flex items-center gap-2 text-xs font-semibold text-white"><TeamCrest team={team} size="sm"/><span>{team.name}</span></div> : null}
      </div>
      <div className={`pitch-stage${compact ? ' pitch-stage-compact' : ''}`} style={{ minHeight: `${stageHeight}px` }} role="group" aria-label={`${team?.name || 'Football'} pitch showing ${markers.length} player position${markers.length === 1 ? '' : 's'}`}>
        <div className="pitch-field" aria-hidden="true">
          <div className="pitch-edge" />
          <div className="pitch-halfway" />
          <div className="pitch-center-circle" />
          <div className="pitch-box pitch-box-left" />
          <div className="pitch-box pitch-box-right" />
          <div className="pitch-six pitch-six-left" />
          <div className="pitch-six pitch-six-right" />
          <div className="pitch-spot pitch-spot-left" />
          <div className="pitch-spot pitch-spot-right" />
          <div className="pitch-glow" />
        </div>
        {markers.map(({ player, top }, index) => <Marker key={player.id} player={player} team={team || player.team} top={top} featured={Boolean(featuredPlayer)} delay={index * 65}/>) }
        {!markers.length ? <div className="pitch-empty">No players match this position filter.</div> : null}
      </div>
      {!compact && markers.length ? <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted">{positionOrder.map((position) => <span key={position}>{t(positionKey(position))}</span>)}</div> : null}
    </section>
  )
}
