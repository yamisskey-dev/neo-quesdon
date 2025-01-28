'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const BACKGROUND_IMAGES = [
  '/static/1.gif',
  '/static/2.gif',
  '/static/3.gif',
  '/static/4.gif'
] as const

// Cache for preloaded images
const imageCache = new Map<string, HTMLImageElement>()

export default function BackgroundWrapper() {
  const [bgImage, setBgImage] = useState<typeof BACKGROUND_IMAGES[number]>(BACKGROUND_IMAGES[0])
  const [isLoaded, setIsLoaded] = useState(false)

  // Optimized image preloading with caching
  useEffect(() => {
    let mounted = true
    const preloadImages = async () => {
      try {
        // Load first image with priority
        const img = new window.Image()
        img.src = BACKGROUND_IMAGES[0]
        await new Promise((resolve) => {
          img.onload = () => {
            imageCache.set(BACKGROUND_IMAGES[0], img)
            if (mounted) {
              setIsLoaded(true)
              resolve(null)
            }
          }
        })

        // Preload remaining images in background
        await Promise.all(BACKGROUND_IMAGES.slice(1).map(src => 
          new Promise((resolve) => {
            if (imageCache.has(src)) {
              resolve(null)
              return
            }
            const img = new window.Image()
            img.src = src
            img.onload = () => {
              imageCache.set(src, img)
              resolve(null)
            }
          })
        ))
      } catch (error) {
        console.error('Failed to load images:', error)
      }
    }

    void preloadImages()
    return () => { mounted = false }
  }, [])

  // Background rotation with cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setBgImage(prev => {
        const currentIndex = BACKGROUND_IMAGES.indexOf(prev)
        const nextIndex = (currentIndex + 1) % BACKGROUND_IMAGES.length
        return BACKGROUND_IMAGES[nextIndex]
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0">
      <div className="absolute inset-0 bg-neutral-900" />
      <Image
        src={bgImage}
        alt="Background"
        fill
        priority
        unoptimized // Add this prop for GIF support
        quality={75}
        sizes="100vw"
        className={`object-cover transition-opacity duration-150 ${
          isLoaded ? 'opacity-60' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
      />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
    </div>
  )
}