import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import TableFrame from '../../components/admin/TableFrame'
import FormModal from '../../components/admin/FormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import SearchField from '../../components/ui/SearchField'
import {
  useAdminCollection,
  useCreateAdminItem,
  useDeleteAdminItem,
  useUpdateAdminItem,
} from '../../hooks/useAdmin'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import { cn } from '../../utils/cn'
import { formatDateTime, formatTimeAgo } from '../../utils/format'
import { initialsOf } from '../../utils/media'
import { isMockMode } from '../../services/api'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'EDITOR',
  teamId: '',
  status: 'Active',
  phone: '',
}

function UserForm({ initial, teams, onSubmit, onClose, isPending, error, isSelf }) {
  const { t } = useI18n()
  const [form, setForm] = useState(initial)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <FormModal
      open
      onClose={onClose}
      size="md"
      title={initial.id ? t('admin.users.editTitle') : t('admin.users.new')}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(form)
      }}
      isPending={isPending}
      error={error}
      submitLabel={initial.id ? t('admin.save') : t('admin.create')}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="user-name" className="label">
            {t('admin.form.name')} *
          </label>
          <input
            id="user-name"
            className="input"
            required
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="user-email" className="label">
            {t('admin.form.email')} *
          </label>
          <input
            id="user-email"
            type="email"
            className="input"
            required
            value={form.email}
            onChange={(event) => set('email', event.target.value)}
          />
        </div>
        {isMockMode ? <div>
          <label htmlFor="user-phone" className="label">
            {t('admin.form.phone')}
          </label>
          <input
            id="user-phone"
            className="input"
            value={form.phone}
            onChange={(event) => set('phone', event.target.value)}
          />
        </div> : null}
        <div>
          <label htmlFor="user-password" className="label">
            {t('admin.form.password')} {initial.id ? '' : '*'}
          </label>
          <input
            id="user-password"
            type="password"
            className="input"
            required={!initial.id}
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => set('password', event.target.value)}
          />
          <p className="mt-1 text-[10px] text-muted">{isMockMode ? t('admin.defaultPassword') : 'Use at least 8 characters.'}</p>
        </div>
        <div>
          <label htmlFor="user-role" className="label">
            {t('admin.form.role')}
          </label>
          <select
            id="user-role"
            className="input"
            value={form.role}
            disabled={isSelf}
            onChange={(event) => set('role', event.target.value)}
          >
            <option value="EDITOR">{t('admin.editor')}</option>
            <option value="TEAM_MANAGER">Team manager</option>
            <option value="ADMIN">{t('admin.adminRole')}</option>
          </select>
        </div>
        {form.role === 'TEAM_MANAGER' ? <div className="sm:col-span-2">
          <label htmlFor="user-team" className="label">Assigned team *</label>
          <select id="user-team" className="input" required value={form.teamId || ''} onChange={(event) => set('teamId', event.target.value)}>
            <option value="">Select a team</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </div> : null}
        <div className="sm:col-span-2">
          <label htmlFor="user-status" className="label">
            {t('admin.form.statusActive')}
          </label>
          <select
            id="user-status"
            className="input"
            value={form.status}
            disabled={isSelf}
            onChange={(event) => set('status', event.target.value)}
          >
            <option value="Active">{t('admin.active')}</option>
            <option value="Inactive">{t('admin.inactive')}</option>
          </select>
          {isSelf ? (
            <p className="mt-1 text-[10px] text-muted">{t('admin.users.selfLocked')}</p>
          ) : null}
        </div>
        {isMockMode ? (
          <p className="rounded-lg bg-surface2/60 p-3 text-[10px] leading-relaxed text-muted sm:col-span-2">
            {t('admin.users.demoNote')}
          </p>
        ) : null}
      </div>
    </FormModal>
  )
}

export default function AdminUsers() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.users.title'))
  const currentUser = useAuthStore((state) => state.user)
  const pushToast = useUiStore((state) => state.pushToast)
  const usersQuery = useAdminCollection('users')
  const teamsQuery = useAdminCollection('teams')
  const createItem = useCreateAdminItem('users')
  const updateItem = useUpdateAdminItem('users')
  const deleteItem = useDeleteAdminItem('users')
  const [editor, setEditor] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  const closeEditor = () => {
    setEditor(null)
    setFormError('')
  }

  const openEdit = (user) => {
    setFormError('')
    setEditor({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      teamId: user.teamId || '',
    })
  }

  const save = async (form) => {
    setFormError('')
    const { id, ...rest } = form
    const payload = { ...rest }
    if (payload.role !== 'TEAM_MANAGER') delete payload.teamId
    if (!payload.password) delete payload.password
    try {
      if (id) {
        await updateItem.mutateAsync({ id, ...payload })
        pushToast(t('admin.recordSaved'))
      } else {
        await createItem.mutateAsync(payload)
        pushToast(t('admin.recordCreated'))
      }
      closeEditor()
    } catch (error) {
      setFormError(error.message)
    }
  }

  const remove = async () => {
    if (!pendingDelete) return
    try {
      await deleteItem.mutateAsync(pendingDelete.id)
      pushToast(t('admin.recordDeleted'))
      setPendingDelete(null)
    } catch (error) {
      pushToast(error.message, 'error')
      setPendingDelete(null)
    }
  }

  const users = (usersQuery.data || []).filter((user) => {
    if (roleFilter && user.role !== roleFilter) return false
    if (statusFilter && user.status !== statusFilter) return false
    return `${user.name} ${user.email} ${user.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  })

  return (
    <>
      <AdminPageHeader
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle')}
        actions={
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => {
              setFormError('')
              setEditor({ ...emptyForm })
            }}
          >
            <Plus size={16} />
            {t('admin.users.new')}
          </button>
        }
      />
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_10rem]">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder={t('admin.search')}
          />
          <select
            aria-label={t('admin.role')}
            className="input"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="">{t('admin.allFilter')}</option>
            <option value="ADMIN">{t('admin.adminRole')}</option>
            <option value="EDITOR">{t('admin.editor')}</option>
            <option value="TEAM_MANAGER">Team manager</option>
          </select>
          <select
            aria-label={t('admin.status')}
            className="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">{t('admin.allFilter')}</option>
            <option value="Active">{t('admin.active')}</option>
            <option value="Inactive">{t('admin.inactive')}</option>
          </select>
        </div>

        <TableFrame
          isLoading={usersQuery.isLoading}
          error={usersQuery.error}
          onRetry={usersQuery.refetch}
          isEmpty={!users.length}
        >
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">{t('admin.users.columns.user')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.users.columns.role')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.users.columns.status')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.users.columns.lastActive')}</th>
                <th className="px-4 py-3 text-right font-bold">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => {
                const isSelf = user.id === currentUser.id
                return (
                  <tr key={user.id} className="hover:bg-hover/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                            user.role === 'ADMIN'
                              ? 'bg-accent/15 text-accent'
                              : 'bg-surface2 text-white',
                          )}
                        >
                          {initialsOf(user.name)}
                        </span>
                        <div>
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-white">
                            {user.name}
                            {isSelf ? (
                              <span className="rounded bg-surface2 px-1.5 py-0.5 text-[9px] font-bold text-muted">
                                {t('admin.users.you')}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[10px] text-muted">{user.email}</p>
                          {user.phone ? (
                            <p className="text-[10px] text-muted">{user.phone}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                          user.role === 'ADMIN'
                            ? 'bg-accent/12 text-accent'
                            : 'bg-surface2 text-muted',
                        )}
                      >
                        {user.role === 'ADMIN' ? (
                          <ShieldCheck size={11} />
                        ) : (
                          <ShieldAlert size={11} />
                        )}
                        {user.role === 'ADMIN' ? t('admin.adminRole') : user.role === 'TEAM_MANAGER' ? `Team manager${user.teamName ? ` · ${user.teamName}` : ''}` : t('admin.editor')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            user.status === 'Active' ? 'bg-positive' : 'bg-muted',
                          )}
                        />
                        {user.status === 'Active' ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white">
                        {user.lastActive ? formatTimeAgo(user.lastActive, t) : t('admin.users.never')}
                      </p>
                      <p className="text-[10px] text-muted">
                        {user.lastActive ? formatDateTime(user.lastActive) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="btn btn-secondary px-2.5 py-1.5 text-[11px]"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(user)}
                          disabled={isSelf}
                          aria-label={t('common.delete')}
                          title={isSelf ? t('admin.cannotDeleteSelf') : t('common.delete')}
                          className="rounded p-2 text-muted hover:bg-negative/10 hover:text-negative disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableFrame>
      </div>

      {editor ? (
        <UserForm
          key={editor.id || 'new'}
          initial={editor}
          teams={teamsQuery.data || []}
          onSubmit={save}
          onClose={closeEditor}
          isPending={createItem.isPending || updateItem.isPending}
          error={formError}
          isSelf={editor.id === currentUser.id}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        isPending={deleteItem.isPending}
        title={pendingDelete?.name}
        warning={t('admin.users.deleteWarning')}
      />
    </>
  )
}
