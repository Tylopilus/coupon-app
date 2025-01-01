'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Tag, Trash2 } from 'lucide-react'
import { CouponList } from './components/CouponList'
import { NotificationHandler } from './components/NotificationHandler'
import { ConfirmationModal } from './components/ConfirmationModal'
import { deleteExpiredCoupons, hasExpiredCoupons } from './utils/storage'

export default function Home() {
  console.log('Home component rendered');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const [hasExpired, setHasExpired] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkExpiredCoupons = async () => {
      const expired = await hasExpiredCoupons();
      setHasExpired(expired);
    };
    checkExpiredCoupons();
  }, [refreshTrigger]);

  const handleDeleteExpired = async () => {
    const count = await deleteExpiredCoupons();
    setDeletedCount(count);
    setIsModalOpen(false);
    const expired = await hasExpiredCoupons();
    setHasExpired(expired);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCouponDeleted = async () => {
    const expired = await hasExpiredCoupons();
    setHasExpired(expired);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="container mx-auto p-4 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
          <Tag className="mr-2 text-blue-500" />
          My Coupons
        </h1>
        <div className="flex space-x-2">
          {hasExpired && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Delete expired coupons"
            >
              <Trash2 size={24} />
            </button>
          )}
          <Link href="/add-coupon" className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors">
            <PlusCircle size={24} />
          </Link>
        </div>
      </div>
      <CouponList onCouponDeleted={handleCouponDeleted} refreshTrigger={refreshTrigger} />
      <NotificationHandler />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeleteExpired}
        title="Delete Expired Coupons"
        message="Are you sure you want to delete all expired coupons? This action cannot be undone."
      />
      {deletedCount > 0 && (
        <div className="mt-4 p-4 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-md">
          {deletedCount} expired coupon{deletedCount !== 1 ? 's' : ''} deleted successfully.
        </div>
      )}
    </main>
  )
}

