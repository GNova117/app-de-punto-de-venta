import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef } from 'react'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

const ELEMENT_ID = 'barcode-scanner-region'

export default function BarcodeScannerModal({ onDetected, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const closedRef = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID)
    scannerRef.current = scanner
    closedRef.current = false

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decodedText) => {
          if (closedRef.current) return
          closedRef.current = true
          onDetected(decodedText)
        },
        undefined,
      )
      .catch(() => {
        // Cámara no disponible; el usuario puede cerrar y capturar manualmente.
      })

    return () => {
      closedRef.current = true
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Escanear código de barras</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div id={ELEMENT_ID} className="overflow-hidden rounded-lg bg-black" />
        <p className="mt-3 text-center text-sm text-gray-500">
          Apunta la cámara al código de barras del producto.
        </p>
      </div>
    </div>
  )
}
