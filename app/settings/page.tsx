'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { getNotificationPreferences, setNotificationPreferences } from '../utils/storage'

export default function Settings() {
  const router = useRouter()
  const [preferences, setPreferences] = useState({
    daysBeforeExpiry: 3,
    notificationTime: '09:00',
  })

  useEffect(() => {
    const storedPreferences = getNotificationPreferences()
    if (storedPreferences) {
      setPreferences(storedPreferences)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPreferences(prev => ({
      ...prev,
      [name]: name === 'daysBeforeExpiry' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNotificationPreferences(preferences)
    router.push('/')
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Notification Settings</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="daysBeforeExpiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notify me before expiry
          </label>
          <select
            id="daysBeforeExpiry"
            name="daysBeforeExpiry"
            value={preferences.daysBeforeExpiry}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value={1}>1 day</option>
            <option value={2}>2 days</option>
            <option value={3}>3 days</option>
            <option value={5}>5 days</option>
            <option value={7}>7 days</option>
          </select>
        </div>
        <div>
          <label htmlFor="notificationTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notification time
          </label>
          <input
            type="time"
            id="notificationTime"
            name="notificationTime"
            value={preferences.notificationTime}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors flex items-center justify-center"
        >
          <Save className="h-5 w-5 mr-2" />
          Save Settings
        </button>
      </form>
    </div>
  )
}

