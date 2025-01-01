'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import JsBarcode from 'jsbarcode'

interface CodeDisplayProps {
  code: string
  codeType?: 'qr' | 'barcode'
  codeImage?: string
}

export function CodeDisplay({ code, codeType, codeImage }: CodeDisplayProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (barcodeRef.current && codeType === 'barcode') {
      JsBarcode(barcodeRef.current, code, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: false,
      })
    }
  }, [code, codeType])

  if (codeImage) {
    return <img src={codeImage} alt="Scanned Code" className="w-full h-auto" />
  }

  if (codeType === 'qr') {
    return (
      <div className="flex justify-center items-center">
        <QRCode value={code} size={200} />
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center">
      <svg ref={barcodeRef}></svg>
    </div>
  )
}

