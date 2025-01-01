'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { Camera, XCircle, RefreshCw, Upload } from 'lucide-react'
import jsQR from 'jsqr'

interface CameraCaptureProps {
  onCapture: (imageData: string, codeData?: { type: 'qr' | 'barcode', value: string }) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const startCapture = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = mediaStream

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      } else {
        throw new Error('Video element is not available')
      }

      setScanning(true)
      setCameraError(null)
    } catch (err) {
      console.error("Error accessing camera:", err)
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setCameraError('Camera access denied. Please check your browser settings and try again.')
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera found. Please make sure your device has a camera and try again.')
        } else {
          setCameraError(`Camera error: ${err.message}`)
        }
      } else {
        setCameraError('An unknown error occurred while accessing the camera.')
      }
    }
  }, [])

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }, [])

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        return canvasRef.current.toDataURL('image/jpeg', 0.8)
      }
    }
    return null
  }, [])

  const scanCode = useCallback(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code) {
          return { type: 'qr' as const, value: code.data }
        }
      }
    }
    return null
  }, [])

  useEffect(() => {
    startCapture()
    return () => {
      stopCapture()
    }
  }, [startCapture, stopCapture])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (scanning && !cameraError) {
      intervalId = setInterval(() => {
        const imageData = captureImage()
        if (imageData) {
          const codeData = scanCode()
          if (codeData) {
            handleCapture(imageData, codeData)
          }
        }
      }, 500)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [scanning, cameraError, captureImage, scanCode])

  const handleCapture = useCallback(async (imageData: string, codeData?: { type: 'qr' | 'barcode', value: string }) => {
    stopCapture();
    try {
      await onCapture(imageData, codeData);
    } catch (error) {
      console.error('Error capturing image:', error);
      setCameraError('Failed to process image. Please try again or use a different image.');
    }
  }, [stopCapture, onClose, onCapture]);

  const handleManualCapture = useCallback(() => {
    const imageData = captureImage()
    if (imageData) {
      handleCapture(imageData)
    }
  }, [captureImage, handleCapture])

  const handleClose = useCallback(() => {
    stopCapture()
    onClose()
  }, [stopCapture, onClose])

  const handleRetry = useCallback(() => {
    setCameraError(null)
    startCapture()
  }, [startCapture])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imageData = event.target?.result as string;
          await handleCapture(imageData);
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          setCameraError('Failed to read the image file. Please try again or use a different image.');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing file:', error);
        setCameraError('Failed to process the image file. Please try again or use a different image.');
      }
    }
  }, [handleCapture]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Capture Coupon Image or Code</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close camera"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        {cameraError ? (
          <div className="text-center">
            <p className="text-red-500 mb-4">{cameraError}</p>
            <button
              onClick={handleRetry}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors flex items-center justify-center mx-auto"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Retry Camera Access
            </button>
          </div>
        ) : (
          <div className="relative">
            <video 
              ref={videoRef} 
              className="w-full rounded-lg"
              aria-label="Camera preview"
              playsInline
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <button
                onClick={handleManualCapture}
                className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                aria-label="Take photo"
              >
                <Camera className="h-6 w-6" />
              </button>
              <button
                onClick={triggerFileInput}
                className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                aria-label="Upload image"
              >
                <Upload className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileInput}
        />
      </div>
    </div>
  )
}

