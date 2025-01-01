'use client'

import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { X, Camera, Upload } from 'lucide-react'
import { addCoupon, getStores } from '../utils/storage'
import { checkAndNotifyExpiringCoupons } from '../utils/notifications'
import { CameraCapture } from './CameraCapture'
import { processImageWithAnthropic } from '../utils/imageProcessing'

interface AddCouponModalProps {
  isOpen: boolean
  onClose: () => void
  onCouponAdded: () => void
  store: string
}

export function AddCouponModal({ isOpen, onClose, onCouponAdded, store }: AddCouponModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    expiryDate: '',
    noExpiry: false,
    store: '',
    codeImage: '',
    codeType: '' as 'qr' | 'barcode',
  })
  const [showCamera, setShowCamera] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stores, setStores] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (store) {
      setFormData(prev => ({ ...prev, store }))
    }
    fetchStores()
  }, [store])

  const fetchStores = async () => {
    const fetchedStores = await getStores()
    setStores(fetchedStores)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      const newCoupon = {
        id: uuidv4(),
        ...formData,
        expiryDate: formData.noExpiry ? 'No Expiry' : formData.expiryDate,
      }
      await addCoupon(newCoupon)
      await checkAndNotifyExpiringCoupons()
      onCouponAdded()
      setFormData({ code: '', discount: '', expiryDate: '', noExpiry: false, store: '', codeImage: '', codeType: '' as 'qr' })
    } catch (error) {
      console.error('Error adding coupon:', error)
      setError('Failed to add coupon. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImageCapture = async (imageData: string, codeData?: { type: 'qr' | 'barcode', value: string }) => {
    setShowCamera(false)
    setError(null)
    if (codeData) {
      setFormData(prev => ({ 
        ...prev, 
        code: codeData.value, 
        codeImage: imageData,
        codeType: codeData.type
      }))
      return
    }
    setIsProcessing(true)
    try {
      console.log('Processing image...');
      const data = await processImageWithAnthropic(imageData)
      console.log('Processed image data:', data);
      if (data && (data.code || data.discount || data.store || data.expiryDate)) {
        setFormData(prev => ({
          ...prev,
          code: data.code || prev.code,
          discount: data.discount || prev.discount,
          store: data.store || prev.store,
          expiryDate: data.expiryDate === 'No Expiry' ? '' : data.expiryDate || prev.expiryDate,
          noExpiry: data.expiryDate === 'No Expiry',
          codeImage: imageData,
        }))
      } else {
        setError("No valid data could be extracted from the image. Please try again or enter the details manually.")
      }
    } catch (error) {
      console.error('Error processing image:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred while processing the image. Please try again or enter the details manually.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target?.result as string
        handleImageCapture(imageData)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add Coupon
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="store" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Store
            </label>
            <select
              id="store"
              name="store"
              value={formData.store}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select a store</option>
              {stores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Coupon Code
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                id="code"
                name="code"
                required
                value={formData.code}
                onChange={handleChange}
                className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Scan coupon"
              >
                <Camera className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={triggerFileInput}
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                title="Upload image"
              >
                <Upload className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Discount
            </label>
            <input
              type="text"
              id="discount"
              name="discount"
              required
              value={formData.discount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="noExpiry"
              name="noExpiry"
              checked={formData.noExpiry}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="noExpiry" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              No Expiry Date
            </label>
          </div>
          {!formData.noExpiry && (
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                required={!formData.noExpiry}
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Add Coupon'}
          </button>
        </form>
      </div>
      {showCamera && (
        <CameraCapture
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileInput}
      />
    </div>
  )
}

