import { getCoupons, getNotificationPreferences } from './storage'

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function checkAndNotifyExpiringCoupons() {
  if (!('Notification' in window)) {
    return
  }

  const coupons = await getCoupons()
  console.log({coupons})
  const preferences = await getNotificationPreferences()
  const today = new Date()
  const notificationDate = new Date(today.getTime() + preferences.daysBeforeExpiry * 24 * 60 * 60 * 1000)

  // biome-ignore lint/complexity/noForEach: <explanation>
  coupons.forEach(coupon => {
    const expiryDate = new Date(coupon.expiryDate)
    if (expiryDate > today && expiryDate <= notificationDate) {
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
      
      if (Notification.permission === 'granted') {
        new Notification('Coupon Expiring Soon', {
          body: `Your ${coupon.discount} off coupon for ${coupon.store} expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}!`,
          icon: '/icon-192x192.png'
        })
      }
    }
  })
}

export async function scheduleNotification() {
  const preferences = await getNotificationPreferences()
  const [hours, minutes] = preferences.notificationTime.split(':').map(Number)

  const now = new Date()
  const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime()

  setTimeout(() => {
    checkAndNotifyExpiringCoupons()
    scheduleNotification() // Schedule the next notification
  }, timeUntilNotification)
}

