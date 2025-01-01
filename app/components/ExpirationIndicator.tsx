import { useMemo } from 'react'

interface ExpirationIndicatorProps {
  expiryDate: string
}

export function ExpirationIndicator({ expiryDate }: ExpirationIndicatorProps) {
  const { color, text } = useMemo(() => {
    if (expiryDate === 'No Expiry') {
      return { color: 'bg-blue-500', text: 'No Expiry' }
    }

    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime()- today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 3) return { color: 'bg-red-500', text: `${diffDays} day${diffDays !== 1 ? 's' : ''}` }
    if (diffDays <= 7) return { color: 'bg-yellow-500', text: `${diffDays} days` }
    return { color: 'bg-green-500', text: `${diffDays} days` }
  }, [expiryDate])

  return (
    <div 
      className={`px-2 py-1 rounded-full ${color} text-white text-xs font-medium`}
      title={`Expires in ${text}`}
    >
      {text}
    </div>
  )
}

