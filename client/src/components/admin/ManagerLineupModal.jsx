import { useState } from 'react'
import FormModal from './FormModal'
import { emptyLineupSide, TeamLineupEditor } from './LineupEditorModal'
import { useI18n } from '../../hooks/useI18n'

export default function ManagerLineupModal({ match, team, players, isPending, onClose, onSave }) {
  const { t } = useI18n()
  const side = match.homeTeamId === team.id ? 'home' : 'away'
  const saved = match.lineups?.[side]
  const [lineup, setLineup] = useState(() => saved ? {
    formation: saved.formation || '4-3-3',
    starters: [...(saved.rows || []).flatMap((row) => (row.players || []).map((player) => player.playerId)), ...Array(11).fill('')].slice(0, 11),
    bench: (saved.bench || []).map((player) => player.playerId),
  } : emptyLineupSide())
  const [error, setError] = useState('')

  return (
    <FormModal
      open
      size="xl"
      onClose={onClose}
      title={`${t('admin.fixtures.lineupsTitle')} · ${team.name}`}
      description={`${match.homeTeam?.name} vs ${match.awayTeam?.name} · ${t('admin.fixtures.upcomingOnly')}`}
      error={error}
      isPending={isPending}
      submitLabel={t('admin.fixtures.saveLineups')}
      onSubmit={(event) => {
        event.preventDefault()
        const payload = { formation: lineup.formation, starters: lineup.starters.filter(Boolean), bench: lineup.bench }
        if (!payload.starters.length) {
          setError(t('admin.fixtures.needStarters'))
          return
        }
        setError('')
        onSave(payload)
      }}
    >
      <TeamLineupEditor
        team={team}
        players={players.filter((player) => player.teamId === team.id)}
        value={lineup}
        onChange={setLineup}
        t={t}
      />
    </FormModal>
  )
}
