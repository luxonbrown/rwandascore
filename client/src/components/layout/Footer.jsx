import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail, MapPin, Twitter, Youtube } from 'lucide-react'
import Container from '../ui/Container'
import { siteConfig } from '../../config'
import { useI18n } from '../../hooks/useI18n'

const explore = [
  { to: '/live', key: 'nav.live' },
  { to: '/fixtures', key: 'nav.fixtures' },
  { to: '/results', key: 'nav.results' },
  { to: '/tables', key: 'nav.tables' },
  { to: '/news', key: 'nav.news' },
]

const competitions = [
  { to: '/competitions/rwanda-premier-league', label: 'Rwanda Premier League' },
  { to: '/competitions/peace-cup', label: 'Peace Cup' },
  { to: '/competitions/amavubi', label: 'Amavubi' },
]

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="mt-12 border-t border-line bg-surface/40">
      <Container className="py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.webp" alt="RwandaScore" className="h-11 w-[165px] object-contain object-left" />
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted">{t('footer.about')}</p>
            <p className="mt-3 text-[11px] font-semibold text-accent">
              {siteConfig.season} · {t('common.season')}
            </p>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-white">
              {t('footer.explore')}
            </h2>
            <ul className="mt-3 space-y-2">
              {explore.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs text-muted transition-colors hover:text-accent">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-white">
              {t('footer.competitions')}
            </h2>
            <ul className="mt-3 space-y-2">
              {competitions.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs text-muted transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-white">
              {t('footer.contact')}
            </h2>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li className="flex items-center gap-2">
                <Mail size={13} />
                <a href={`mailto:${siteConfig.email}`} className="hover:text-accent">
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <span>{siteConfig.address}</span>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              {[
                { href: siteConfig.socials.x, icon: Twitter, label: 'X' },
                { href: siteConfig.socials.facebook, icon: Facebook, label: 'Facebook' },
                { href: siteConfig.socials.instagram, icon: Instagram, label: 'Instagram' },
                { href: siteConfig.socials.youtube, icon: Youtube, label: 'YouTube' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface2 text-muted transition-colors hover:border-accent/40 hover:text-accent"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-line pt-5 text-[11px] text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. {t('footer.rights')}
          </p>
          <p>{t('footer.disclaimer')}</p>
        </div>
      </Container>
    </footer>
  )
}
