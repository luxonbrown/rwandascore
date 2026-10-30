import { useState } from 'react'
import { ImagePlus, LoaderCircle, Link2 } from 'lucide-react'

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default function PlayerFaceField({ value = '', onChange, upload }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const handleDrop = async (event) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    if (!acceptedTypes.has(file.type)) {
      setError('Use a JPG, PNG, or WebP image.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const result = await upload(file)
      onChange(result.faceId || result.url)
    } catch (cause) {
      setError(cause.message || 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="sm:col-span-2">
      <span className="label">Player face</span>
      <div
        role="region"
        aria-label="Drop player face image here"
        onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
        onDrop={handleDrop}
        className={`relative flex min-h-32 items-center gap-4 rounded-xl border border-dashed p-4 transition-colors ${dragging ? 'border-accent bg-accent/10' : 'border-line bg-surface2/50'}`}
      >
        {value ? (
          <img src={value} alt="Player face preview" className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover" onError={() => setError('The image URL could not be loaded.')} />
        ) : (
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-line bg-surface2 text-muted"><ImagePlus size={26} /></span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{uploading ? 'Uploading image…' : 'Drag and drop the player photo here'}</p>
          <p className="mt-1 text-xs text-muted">JPG, PNG, or WebP · maximum 2 MB</p>
          {uploading ? <LoaderCircle size={15} className="mt-2 animate-spin text-accent" /> : null}
        </div>
      </div>
      <label className="mt-3 block">
        <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-muted"><Link2 size={12} /> Or paste an image URL</span>
        <input type="url" className="input" placeholder="https://example.com/player.jpg" value={value} onChange={(event) => { setError(''); onChange(event.target.value) }} />
      </label>
      {error ? <p role="alert" className="mt-1 text-xs text-negative">{error}</p> : null}
    </div>
  )
}
