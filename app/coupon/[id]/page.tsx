'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { getCoupons, deleteCoupon, Coupon } from '../../utils/storage'
import { ExpirationIndicator } from '../../components/ExpirationIndicator'
import { CopyButton } from '../../components/CopyButton'
import { CodeDisplay } from '../../components/CodeDisplay'
import { EditCouponModal } from '../../components/EditCouponModal'

export default function CouponDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null)
  const deleteStartTimeRef = useRef<number | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    const loadCoupon = async () => {
      try {
        const coupons = await getCoupons()
        const foundCoupon = coupons.find((c: Coupon) => c.id === params.id)
        if (foundCoupon) {
          setCoupon(foundCoupon)
        }
      } catch (error) {
        console.error('Error loading coupon:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCoupon()
  }, [params.id])

  const isExpired = (expiryDate: string) => {
    if (expiryDate === 'No Expiry') return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    return expiry < today
  }

  const startDelete = () => {
    if (coupon && !isExpired(coupon.expiryDate)) {
      setIsDeleting(true)
      deleteStartTimeRef.current = Date.now()
      deleteTimerRef.current = setInterval(() => {
        console.log('interval')
        const elapsedTime = Date.now() - (deleteStartTimeRef.current || 0)
        const progress = Math.min((elapsedTime / 1000) * 100, 100)
        setDeleteProgress(progress)
        if (progress === 100) {
          handleDelete()
        }
      }, 50)
    } else {
      handleDelete()
    }
  }

  const cancelDelete = () => {
    if (deleteTimerRef.current) {
      clearInterval(deleteTimerRef.current)
    }
    setIsDeleting(false)
    setDeleteProgress(0)
  }

  const handleDelete = async () => {
    if (coupon) {
      try {
        await deleteCoupon(coupon.id)
        cancelDelete()
        router.push('/')
      } catch (error) {
        console.error('Error deleting coupon:', error)
        // Handle error (e.g., show an error message to the user)
      }
    }
  }

  if (isLoading) {
    return <div className="container mx-auto p-4 max-w-md">Loading...</div>
  }

  if (!coupon) {
    return <div className="container mx-auto p-4 max-w-md">Coupon not found</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{coupon.store}</h1>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <ExpirationIndicator expiryDate={coupon.expiryDate} />
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Coupon Details</h2>
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{coupon.discount} off</p>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Code: <span className="font-medium">{coupon.code}</span></p>
            <CopyButton text={coupon.code} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {coupon.expiryDate === 'No Expiry' ? 'No Expiry Date' : `Expires: ${coupon.expiryDate}`}
          </p>
          <CodeDisplay code={coupon.code} codeType={coupon.codeType} codeImage={coupon.codeImage} />
        </div>
        <div className="relative">
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setEditModalOpen(true)}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors flex items-center justify-center"
              aria-label="Edit Coupon"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onMouseDown={startDelete}
              onMouseUp={cancelDelete}
              onMouseLeave={cancelDelete}
              onTouchStart={startDelete}
              onTouchEnd={cancelDelete}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors flex items-center justify-center"
              aria-label="Delete Coupon"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              {isExpired(coupon.expiryDate) ? 'Delete' : 'Hold to Delete'}
            </button>
          </div>
          {isDeleting && !isExpired(coupon.expiryDate) && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-red-700 transition-all duration-100 ease-linear rounded-b-md"
              style={{ width: `${deleteProgress}%` }}
              role="progressbar"
              aria-valuenow={deleteProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          )}
        </div>
      </div>
      <EditCouponModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onCouponEdited={async () => {
          const updatedCoupons = await getCoupons()
          const updatedCoupon = updatedCoupons.find((c) => c.id === coupon.id)
          if (updatedCoupon) {
            setCoupon(updatedCoupon)
          }
          setEditModalOpen(false)
        }}
        coupon={coupon}
      />
    </div>
)

}

