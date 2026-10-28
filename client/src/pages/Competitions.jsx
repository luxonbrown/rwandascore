import { Link } from 'react-router-dom'
import { ArrowUpRight, Flag, Shield, Trophy } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import ErrorState from '../components/ui/ErrorState'
import { CardGridSkeleton } from '../components/ui/Skeletons'
import { useCompetitions } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'

const typeIcons = {
  league: Shield,
  cup: Trophy,
  national: Flag,
}

const typeLabels = {
  league: 'competitions.league',
  cup: 'competitions.cup',
  national: 'competitions.national',
}

const stageKeys = {
  'rwanda-premier-league': 'competitions.rplStage',
  'peace-cup': 'competitions.peaceCupStage',
  amavubi: 'competitions.amavubiStage',
}

export default function Competitions() {
  const { t } = useI18n()
  useDocumentTitle(t('competitions.title'))
  const competitionsQuery = useCompetitions()
  const competitions = competitionsQuery.data || []

  return (
    <>
      <PageHeader
        eyebrow={t('nav.competitions')}
        title={t('competitions.title')}
        subtitle={t('competitions.subtitle')}
      />

      <Container className="py-8">
        {competitionsQuery.isLoading ? (
          <CardGridSkeleton count={3} className="lg:grid-cols-3" />
        ) : competitionsQuery.isError ? (
          <ErrorState error={competitionsQuery.error} onRetry={competitionsQuery.refetch} />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {competitions.map((competition) => {
              const Icon = typeIcons[competition.type] || Trophy
              return (
                <Link
                  key={competition.id}
                  to={`/competitions/${competition.id}`}
                  className="card group relative overflow-hidden p-5 transition-colors hover:border-white/20"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-20"
                    style={{
                      background: `radial-gradient(circle at 15% 0%, ${competition.color}, transparent 65%)`,
                    }}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-black shadow-card"
                        style={{
                          backgroundColor: competition.color,
                          color: competition.secondaryColor || '#fff',
                        }}
                      >
                        {competition.logoText}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface2 text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
                        <ArrowUpRight size={15} />
                      </span>
                    </div>
                    <h2 className="mt-4 text-lg font-extrabold leading-tight text-white">
                      {competition.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted">{t(stageKeys[competition.id] || 'competitions.overview')}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2 py-1">
                        <Icon size={11} />
                        {t(typeLabels[competition.type] || 'competitions.competitions')}
                      </span>
                      <span className="rounded-full bg-surface2 px-2 py-1">{competition.season}</span>
                      <span className="rounded-full bg-surface2 px-2 py-1">
                        {competition.teamCount} {t('competitions.teams')}
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-white/60">
                      {competition.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Shield size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-white">16</p>
              <p className="text-[11px] text-muted">{t('competitions.teams')}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Trophy size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-white">{t('competitions.season')}</p>
              <p className="text-[11px] text-muted">2025/26</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Flag size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-white">{t('competitions.amavubi')}</p>
              <p className="text-[11px] text-muted">{t('competitions.national')}</p>
            </div>
          </div>
        </div>
      </Container>
    </>
  )
}
