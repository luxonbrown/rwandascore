export default function BrandLogo({ className = '' }) {
  return (
    <span className={`brand-logo-search ${className}`}>
      <img src="/logo.webp" alt="RwandaScore" className="relative z-0 h-full w-full object-contain object-left" />
    </span>
  )
}
