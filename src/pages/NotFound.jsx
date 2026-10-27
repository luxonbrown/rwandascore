import { Link } from 'react-router-dom'
import { Compass, Home, Search } from 'lucide-react'
import Container from '../components/ui/Container'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'

export default function NotFound() {
  const { t } = useI18n()
  useDocumentTitle(t('notFound.title'))

  return (
    <Container className="flex min-h-[62vh] flex-col items-center justify-center py-16 text-center">
      <div className="relative">
        <p className="text-7xl font-black tracking-tighter text-surface2 sm:text-8xl">404</p>
        <span className="absolute -right-3 -top-2 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink text-accent">
          <Compass size={22} />
        </span>
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-white">{t('notFound.title')}</h1>
      <p className="mt-2 max-w-md text-sm text-muted">{t('notFound.body')}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/" className="btn btn-accent">
          <Home size={15} />
          {t('notFound.action')}
        </Link>
        <Link to="/search" className="btn btn-secondary">
          <Search size={15} />
          {t('search.title')}
        </Link>
      </div>
    </Container>
  )
}
