import { useMemo, useState } from 'react'
import FormModal from './FormModal'
import { useI18n } from '../../hooks/useI18n'

const formations = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2']

export function emptyLineupSide() {
  return {
    formation: '4-3-3',
    starters: Array(11).fill(''),
    bench: [],
  }
}

function sideFromSaved(lineup) {
  const starters = (lineup?.rows || [])
    .flatMap((row) => row.players || [])
    .map((player) => player.playerId)
    .filter(Boolean)
  const bench = (lineup?.bench || []).map((player) => player.playerId).filter(Boolean)
  return {
    formation: formations.includes(lineup?.formation) ? lineup.formation : '4-3-3',
    starters: [...starters, ...Array(Math.max(0, 11 - starters.length)).fill('')].slice(0, 11),
    bench,
  }
}

export function lineupFormFromSaved(lineups) {
  return { home: sideFromSaved(lineups?.home), away: sideFromSaved(lineups?.away) }
}

export function lineupFormToPayload(form) {
  return Object.fromEntries(['home', 'away'].map((side) => [side, {
    formation: form[side].formation,
    starters: form[side].starters.filter(Boolean),
    bench: form[side].bench,
  }]))
}

function rowGroups(formation, t) {
  const sizes = [1, ...formation.split('-').map(Number)]
  return sizes.map((count, index) => ({
    count,
    label: index === 0
      ? t('admin.fixtures.goalkeeper')
      : index === 1
        ? t('admin.fixtures.defenders')
        : index === sizes.length - 1
          ? t('admin.fixtures.forwards')
          : t('admin.fixtures.midfield'),
  }))
}

function TeamLineupEditor({ team, players, value, onChange, t }) {
  const groups = rowGroups(value.formation, t)
  const selectedStarters = useMemo(() => new Set(value.starters.filter(Boolean)), [value.starters])
  const playerLabel = (player) => `${player.number ? `#${player.number} · ` : ''}${player.name}`

  const setStarter = (index, playerId) => {
    const starters = [...value.starters]
    starters[index] = playerId
    onChange({
      ...value,
      starters,
      bench: value.bench.filter((id) => id !== playerId),
    })
  }

  const toggleBench = (playerId) => {
    const bench = value.bench.includes(playerId)
      ? value.bench.filter((id) => id !== playerId)
      : [...value.bench, playerId]
    onChange({ ...value, bench })
  }

  let slot = 0
  return (
    <section className="rounded-xl border border-line bg-surface2/30 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">{team?.name}</h3>
          <p className="mt-1 text-[11px] text-muted">
            {players.length} {t('admin.fixtures.registeredPlayers')}
          </p>
        </div>
        <select
          aria-label={`${team?.name} ${t('admin.fixtures.formation')}`}
          className="input w-32"
          value={value.formation}
          onChange={(event) => onChange({ ...value, formation: event.target.value })}
        >
          {formations.map((formation) => <option key={formation}>{formation}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {groups.map((group, groupIndex) => {
          const firstSlot = slot
          slot += group.count
          return (
            <div key={`${group.label}-${groupIndex}`}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                {group.label} · {group.count}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: group.count }, (_, offset) => {
                  const index = firstSlot + offset
                  const selected = value.starters[index]
                  return (
                    <select
                      key={index}
                      aria-label={`${team?.name} ${t('admin.fixtures.starter')} ${index + 1}`}
                      className="input"
                      value={selected}
                      onChange={(event) => setStarter(index, event.target.value)}
                    >
                      <option value="">{t('admin.fixtures.choosePlayer')}</option>
                      {players.map((player) => (
                        <option
                          key={player.id}
                          value={player.id}
                          disabled={selectedStarters.has(player.id) && player.id !== selected}
                        >
                          {playerLabel(player)}
                        </option>
                      ))}
                    </select>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t('admin.fixtures.bench')}</p>
          <span className="text-[10px] text-muted">{value.bench.length}/12</span>
        </div>
        {players.length ? (
          <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
            {players.filter((player) => !selectedStarters.has(player.id)).map((player) => (
              <label key={player.id} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs text-white/85">
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={value.bench.includes(player.id)}
                  disabled={!value.bench.includes(player.id) && value.bench.length >= 12}
                  onChange={() => toggleBench(player.id)}
                />
                <span className="truncate">{playerLabel(player)}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">{t('admin.fixtures.noPlayersForTeam')}</p>
        )}
      </div>
    </section>
  )
}

export function LineupEditorFields({ homeTeam, awayTeam, homeTeamId, awayTeamId, players, value, onChange }) {
  const { t } = useI18n()
  const homePlayers = players.filter((player) => player.teamId === homeTeamId)
  const awayPlayers = players.filter((player) => player.teamId === awayTeamId)

  if (!homeTeamId || !awayTeamId) {
    return <p className="rounded-lg bg-surface2/60 p-3 text-xs text-muted sm:col-span-2">{t('admin.fixtures.selectTeamsForLineups')}</p>
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <h3 className="text-sm font-bold text-white">{t('admin.fixtures.lineupsTitle')}</h3>
        <p className="mt-1 text-xs text-muted">{t('admin.fixtures.lineupsFormHint')}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamLineupEditor team={homeTeam} players={homePlayers} value={value.home} onChange={(home) => onChange({ ...value, home })} t={t} />
        <TeamLineupEditor team={awayTeam} players={awayPlayers} value={value.away} onChange={(away) => onChange({ ...value, away })} t={t} />
      </div>
    </div>
  )
}

export default function LineupEditorModal({ match, players, isPending, onClose, onSave }) {
  const { t } = useI18n()
  const [form, setForm] = useState(() => lineupFormFromSaved(match.lineups))
  const [error, setError] = useState('')
  const homePlayers = players.filter((player) => player.teamId === match.homeTeamId)
  const awayPlayers = players.filter((player) => player.teamId === match.awayTeamId)

  const submit = (event) => {
    event.preventDefault()
    const lineups = lineupFormToPayload(form)
    if (!lineups.home.starters.length || !lineups.away.starters.length) {
      setError(t('admin.fixtures.needStarters'))
      return
    }
    setError('')
    onSave(lineups)
  }

  return (
    <FormModal
      open
      size="xl"
      onClose={onClose}
      title={t('admin.fixtures.lineupsTitle')}
      description={`${match.homeTeam?.name} vs ${match.awayTeam?.name} · ${t('admin.fixtures.upcomingOnly')}`}
      onSubmit={submit}
      isPending={isPending}
      error={error}
      submitLabel={t('admin.fixtures.saveLineups')}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamLineupEditor
          team={match.homeTeam}
          players={homePlayers}
          value={form.home}
          onChange={(home) => setForm((current) => ({ ...current, home }))}
          t={t}
        />
        <TeamLineupEditor
          team={match.awayTeam}
          players={awayPlayers}
          value={form.away}
          onChange={(away) => setForm((current) => ({ ...current, away }))}
          t={t}
        />
      </div>
    </FormModal>
  )
}
