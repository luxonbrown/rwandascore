import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import TableFrame from '../../components/admin/TableFrame'
import SearchField from '../../components/ui/SearchField'
import { useAdminActivity } from '../../hooks/useAdmin'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatDateTime, formatTimeAgo } from '../../utils/format'
import { initialsOf } from '../../utils/media'

export default function AdminActivity() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.activity.title'))
  const activityQuery = useAdminActivity(100)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const rows = useMemo(() => activityQuery.data || [], [activityQuery.data])

  const modules = useMemo(
    () => [...new Set(rows.map((row) => row.module).filter(Boolean))].sort(),
    [rows],
  )
  const actions = useMemo(
    () => [...new Set(rows.map((row) => row.action).filter(Boolean))].sort(),
    [rows],
  )

  const filtered = rows.filter((row) => {
    if (moduleFilter && row.module !== moduleFilter) return false
    if (actionFilter && row.action !== actionFilter) return false
    const haystack = `${row.user} ${row.role} ${row.action} ${row.module} ${row.record} ${row.description} ${row.ip}`
    return haystack.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <AdminPageHeader
        title={t('admin.activity.title')}
        subtitle={t('admin.activity.subtitle')}
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => activityQuery.refetch()}
            disabled={activityQuery.isFetching}
          >
            <RefreshCw size={15} className={activityQuery.isFetching ? 'animate-spin' : ''} />
            {t('admin.activity.refresh')}
          </button>
        }
      />
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_14rem]">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder={t('admin.activity.searchPlaceholder')}
          />
          <select
            aria-label={t('admin.activity.allModules')}
            className="input"
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
          >
            <option value="">{t('admin.activity.allModules')}</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
          <select
            aria-label={t('admin.activity.allActions')}
            className="input"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
          >
            <option value="">{t('admin.activity.allActions')}</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <TableFrame
          isLoading={activityQuery.isLoading}
          error={activityQuery.error}
          onRetry={activityQuery.refetch}
          isEmpty={!filtered.length}
          emptyTitle={t('admin.activity.noActivity')}
        >
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">{t('admin.activity.columns.time')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.activity.columns.user')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.activity.columns.action')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.activity.columns.module')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.activity.columns.record')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.activity.columns.description')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.activity.columns.ip')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((row) => (
                <tr key={row.id} className="align-top hover:bg-hover/40">
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="text-xs font-semibold text-white">
                      {formatTimeAgo(row.createdAt, t)}
                    </p>
                    <p className="text-[10px] text-muted">{formatDateTime(row.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface2 text-[9px] font-bold text-white">
                        {initialsOf(row.user)}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">{row.user}</p>
                        <p className="text-[10px] capitalize text-muted">{row.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-accent">{row.action}</td>
                  <td className="px-4 py-3 text-xs text-muted">{row.module}</td>
                  <td className="px-4 py-3 text-xs text-white">{row.record}</td>
                  <td className="max-w-xs px-4 py-3 text-xs text-muted">{row.description}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-muted">
                    {row.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      </div>
    </>
  )
}
