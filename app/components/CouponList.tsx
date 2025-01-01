'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { getCoupons, deleteCoupon, Coupon } from '../utils/storage'
import { AddCouponModal } from './AddCouponModal'
import { ExpirationIndicator } from './ExpirationIndicator'
import { CopyButton } from './CopyButton'
import { EditCouponModal } from './EditCouponModal'

interface GroupedCoupons {
  [key: string]: Coupon[]
}

interface CouponListProps {
  onCouponDeleted: () => void
  refreshTrigger: number
}

export function CouponList({ onCouponDeleted, refreshTrigger }: CouponListProps) {
  const [groupedCoupons, setGroupedCoupons] = useState<GroupedCoupons>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCoupons()
  }, [refreshTrigger])

  const loadCoupons = async () => {
    try {
      setIsLoading(true)
      const coupons = await getCoupons()
      const grouped = coupons.reduce((acc, coupon) => {
        if (!acc[coupon.store]) {
          acc[coupon.store] = []
        }
        acc[coupon.store].push(coupon)
        return acc
      }, {} as GroupedCoupons)
      setGroupedCoupons(grouped)
      setError(null)
    } catch (err) {
      console.error('Error loading coupons:', err)
      setError('Failed to load coupons. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCoupon = (store: string) => {
    setSelectedStore(store)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedStore('')
  }

  const handleCouponAdded = () => {
    loadCoupons()
    handleModalClose()
  }

  const handleDeleteCoupon = async (id: string) => {
    try {
      await deleteCoupon(id)
      await loadCoupons()
      onCouponDeleted()
    } catch (err) {
      console.error('Error deleting coupon:', err)
      setError('Failed to delete coupon. Please try again.')
    }
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setEditModalOpen(true)
  }

  const isExpired = (expiryDate: string) => {
    if (expiryDate === 'No Expiry') return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    return expiry < today
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading coupons...</div>
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedCoupons).map(([store, coupons]) => (
        <div key={store} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{store}</h2>
            <button
              onClick={() => handleAddCoupon(store)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {coupons.map((coupon) => (
              <li key={coupon.id} className="relative">
                <div className="flex items-center justify-between p-4">
                  <Link href={`/coupon/${coupon.id}`} className="flex-grow hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <ExpirationIndicator expiryDate={coupon.expiryDate} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{coupon.discount} off</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {coupon.expiryDate === 'No Expiry' ? 'No Expiry' : `Expires: ${coupon.expiryDate}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center space-x-2">
                    <CopyButton 
                      text={coupon.code} 
                      className="mr-2"
                    />
                    <button
                      onClick={() => handleEditCoupon(coupon)}
                      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      aria-label="Edit coupon"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <Link href={`/coupon/${coupon.id}`}>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </Link>
                  </div>
                </div>
                {isExpired(coupon.expiryDate) && (
                  <button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="absolute top-1/2 right-20 transform -translate-y-1/2 p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    aria-label="Delete expired coupon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <AddCouponModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onCouponAdded={handleCouponAdded}
        store={selectedStore}
      />
      {selectedCoupon && (
        <EditCouponModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onCouponEdited={() => {
            loadCoupons()
            setEditModalOpen(false)
          }}
          coupon={selectedCoupon}
        />
      )}
    </div>
  )
}

