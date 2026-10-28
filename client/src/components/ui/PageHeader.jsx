import Container from './Container'

export default function PageHeader({ eyebrow, title, subtitle, actions, children }) {
  return (
    <div className="border-b border-line bg-gradient-to-b from-surface/70 to-ink">
      <Container className="py-7 sm:py-9">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </Container>
    </div>
  )
}
