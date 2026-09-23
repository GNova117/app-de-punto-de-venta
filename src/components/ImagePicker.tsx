import { useRef } from 'react'
import { fileToResizedDataUrl } from '../utils/image'

interface Props {
  value?: string
  onChange: (dataUrl: string | undefined) => void
}

export default function ImagePicker({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    const dataUrl = await fileToResizedDataUrl(file)
    onChange(dataUrl)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
        {value ? (
          <img src={value} alt="Producto" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl text-gray-300">📦</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {value ? 'Cambiar foto' : 'Tomar / subir foto'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-red-600 hover:underline"
          >
            Quitar foto
          </button>
        )}
      </div>
    </div>
  )
}
