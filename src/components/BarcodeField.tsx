import { lazy, Suspense, useState } from 'react'

const BarcodeScannerModal = lazy(() => import('./BarcodeScannerModal'))

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export default function BarcodeField({
  value,
  onChange,
  onSubmit,
  placeholder = 'Escanea o escribe el código de barras',
  autoFocus,
}: Props) {
  const [scanning, setScanning] = useState(false)

  return (
    <div className="flex gap-2">
      <input
        type="text"
        inputMode="text"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit?.(value)
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setScanning(true)}
        title="Escanear con cámara"
        className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
      >
        📷
      </button>
      {scanning && (
        <Suspense fallback={null}>
          <BarcodeScannerModal
            onClose={() => setScanning(false)}
            onDetected={(code) => {
              setScanning(false)
              onChange(code)
              onSubmit?.(code)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
