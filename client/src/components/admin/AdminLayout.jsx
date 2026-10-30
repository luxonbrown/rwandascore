import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ExternalLink,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Newspaper,
  Radio,
  Shield,
  Trophy,
  Upload,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import ScrollToTop from '../layout/ScrollToTop'
import { adminNavLinks, editorNavLinks, managerNavLinks } from '../../config'
import { useI18n } from '../../hooks/useI18n'
import { useAuthStore } from '../../store/auth'
import { cn } from '../../utils/cn'
import { initialsOf } from '../../utils/media'

const icons = {
  LayoutDashboard,
  Trophy,
  Shield,
  Users,
  CalendarDays,
  Radio,
  Newspaper,
  Upload,
  History,
  UserCog,
}

function Brand({ home = '/admin', label = 'Administration' }) {
  return (
    <Link to={home} className="flex items-center gap-2.5 px-5 py-5">
      <img src="/logo.webp" alt="RwandaScore" className="h-10 w-[150px] object-contain object-left" />
      <span className="sr-only">{label}</span>
    </Link>
  )
}

function SidebarContent({ user, onNavigate, onLogout }) {
  const { t } = useI18n()
  const manager = user?.role === 'TEAM_MANAGER'
  const links = manager ? managerNavLinks : user?.role === 'EDITOR' ? editorNavLinks : adminNavLinks

  return (
    <div className="flex h-full flex-col">
      <Brand home={manager ? '/manager' : '/admin'} label={manager ? 'Team workspace' : user?.role === 'EDITOR' ? 'Live desk' : 'Administration'} />
      <nav aria-label={t('nav.menu')} className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {links.map((link) => {
          const Icon = icons[link.icon] || LayoutDashboard
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-accent/12 text-accent'
                    : 'text-muted hover:bg-surface2 hover:text-white',
                )
              }
            >
              <Icon size={17} />
              <span>{t(link.key)}</span>
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-line p-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-surface2 hover:text-white"
        >
          <ExternalLink size={15} />
          {t('admin.viewSite')}
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-surface2 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-ink">
            {initialsOf(user?.name || '')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{user?.name}</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
              {user?.role === 'ADMIN' ? t('admin.adminRole') : user?.role === 'EDITOR' ? t('admin.editor') : 'Team manager'}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label={t('admin.logout')}
            title={t('admin.logout')}
            className="rounded p-1.5 text-muted hover:bg-hover hover:text-negative"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const isSessionChecked = useAuthStore((state) => state.isSessionChecked)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  if (!isSessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-muted">
        <Loader2 size={18} className="mr-2 animate-spin" /> Checking session…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  const isManagerPath = location.pathname.startsWith('/manager')
  if (user.role === 'TEAM_MANAGER' && !isManagerPath) return <Navigate to="/manager" replace />
  if (user.role !== 'TEAM_MANAGER' && isManagerPath) return <Navigate to="/admin" replace />
  if (user.role === 'EDITOR' && ['/admin/users', '/admin/settings', '/admin/profile'].some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))) return <Navigate to="/admin" replace />

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink">
      <ScrollToTop />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-surface lg:block">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside className="relative h-full w-72 max-w-[85vw] border-r border-line bg-surface shadow-lift">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={t('common.close')}
              className="absolute right-3 top-4 rounded p-2 text-muted hover:bg-hover hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent
              user={user}
              onNavigate={() => setMenuOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-ink/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('nav.menu')}
              className="btn btn-ghost p-2"
            >
              <Menu size={20} />
            </button>
            <img src="/logo.webp" alt="RwandaScore" className="h-8 w-[120px] object-contain object-left" />
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-ink">
            {initialsOf(user.name)}
          </span>
        </header>
        <main id="main" className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
