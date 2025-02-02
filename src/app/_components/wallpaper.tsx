'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const BACKGROUND_IMAGES = [
  '/static/1.gif',
  '/static/2.gif',
  '/static/3.gif',
  '/static/4.gif'
] as const

type BackgroundImage = typeof BACKGROUND_IMAGES[number]

const imageCache = new Map<string, HTMLImageElement>()
let isGloballyPreloaded = false

export default function BackgroundWrapper() {
  const [bgImage, setBgImage] = useState<BackgroundImage>(BACKGROUND_IMAGES[0])
  const [isVisible, setIsVisible] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isClientSide, setIsClientSide] = useState(false)

  useEffect(() => {
    setIsClientSide(true)
  }, [])

  useEffect(() => {
    if (isClientSide && !isTransitioning) {
      setIsTransitioning(true)
      // フェードアウト完了後に画像変更
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length)
        setBgImage(BACKGROUND_IMAGES[randomIndex])
        setIsTransitioning(false)
      }, 300) // トランジション時間と合わせる
    }
  }, [isClientSide])

  useEffect(() => {
    if (isGloballyPreloaded) {
      setIsVisible(true)
      return
    }

    let mounted = true

    const preloadAll = async () => {
      try {
        if (!imageCache.has(bgImage)) {
          const currentImg = new window.Image()
          currentImg.src = bgImage
          await new Promise<void>((resolve) => {
            currentImg.onload = () => {
              imageCache.set(bgImage, currentImg)
              if (mounted) setIsVisible(true)
              resolve()
            }
          })
        } else {
          setIsVisible(true)
        }

        await Promise.all(
          BACKGROUND_IMAGES
            .filter(src => src !== bgImage && !imageCache.has(src))
            .map(src => new Promise<void>((resolve) => {
              const img = new window.Image()
              img.src = src
              img.onload = () => {
                imageCache.set(src, img)
                resolve()
              }
            }))
        )

        isGloballyPreloaded = true
      } catch (error) {
        console.error('Failed to preload images:', error)
      }
    }

    void preloadAll()
    return () => { mounted = false }
  }, [bgImage])

  return (
    <div className="fixed inset-0">
      <div className="absolute inset-0 bg-neutral-900" />
      <Image
        src={bgImage}
        alt="Background"
        fill
        priority
        unoptimized
        quality={75}
        sizes="100vw"
        className={`object-cover transition-all duration-300 ease-in-out ${
          isVisible && !isTransitioning ? 'opacity-60' : 'opacity-0'
        }`}
        onLoad={() => setIsVisible(true)}
      />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
    </div>
  )
}