/**
 * Site-wide configuration.
 * Change the brand, polling cadence and contact details here.
 */
export const siteConfig = {
  name: 'RwandaScore',
  shortName: 'RS',
  tagline: 'Rwanda football. Every match. Live.',
  description:
    'Live scores, fixtures, results, tables and stories from the BK Premier League, Peace Cup and Amavubi.',
  url: 'https://rwandascore.rw',
  email: 'hello@rwandascore.rw',
  phone: '+250 788 000 000',
  address: 'KG 11 Ave, Kigali, Rwanda',
  season: '2026/27',
  livePollingMs: 15000,
  // WebSocket updates keep live scores, standings and scorer lists in sync;
  // REST polling remains the fallback when the socket is unavailable.
  enableWebSocket: true,
  websocketUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws/live',
  socials: {
    x: 'https://x.com',
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
  },
}

export const navLinks = [
  { to: '/', key: 'nav.scores', end: true },
  { to: '/live', key: 'nav.live' },
  { to: '/fixtures', key: 'nav.fixtures' },
  { to: '/results', key: 'nav.results' },
  { to: '/competitions', key: 'nav.competitions' },
  { to: '/news', key: 'nav.news' },
  { to: '/teams', key: 'nav.teams' },
  { to: '/players', key: 'nav.players' },
]

export const mobileMoreLinks = [
  { to: '/fixtures', key: 'nav.fixtures' },
  { to: '/results', key: 'nav.results' },
  { to: '/competitions', key: 'nav.competitions' },
  { to: '/teams', key: 'nav.teams' },
  { to: '/players', key: 'nav.players' },
  { to: '/favourites', key: 'nav.favourites' },
  { to: '/tables', key: 'nav.tables' },
  { to: '/search', key: 'nav.search' },
]

export const adminNavLinks = [
  { to: '/admin', key: 'admin.dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/admin/notifications', key: 'admin.notifications.title', icon: 'Bell' },
  { to: '/admin/competitions', key: 'admin.competitions.title', icon: 'Trophy' },
  { to: '/admin/teams', key: 'admin.teams.title', icon: 'Shield' },
  { to: '/admin/players', key: 'admin.players.title', icon: 'Users' },
  { to: '/admin/fixtures', key: 'admin.fixtures.title', icon: 'CalendarDays' },
  { to: '/admin/live', key: 'admin.liveControl', icon: 'Radio' },
  { to: '/admin/news', key: 'admin.news.title', icon: 'Newspaper' },
  { to: '/admin/uploads', key: 'admin.uploads.title', icon: 'Upload' },
  { to: '/admin/activity', key: 'admin.activity.title', icon: 'History' },
  { to: '/admin/users', key: 'admin.users.title', icon: 'UserCog' },
]

export const editorNavLinks = adminNavLinks.filter((link) => !['/admin/users', '/admin/notifications'].includes(link.to))

export const managerNavLinks = [
  { to: '/manager', key: 'admin.dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/manager/players', key: 'admin.players.title', icon: 'Users' },
]
