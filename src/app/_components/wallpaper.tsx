'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const BACKGROUND_IMAGES = [
  '/static/1.gif',
  '/static/2.gif',
  '/static/3.gif',
  '/static/4.gif'
] as const

export default function BackgroundWrapper() {
  const [bgImage, setBgImage] = useState<typeof BACKGROUND_IMAGES[number]>(BACKGROUND_IMAGES[0])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const randomBg = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)]
    setBgImage(randomBg)
  }, [])

  return (
    <div className="fixed inset-0">
      <div className="absolute inset-0 bg-neutral-900" />
      <Image
        src={bgImage}
        alt="Background"
        fill
        priority
        unoptimized
        sizes="100vw"
        className={`object-cover transition-opacity duration-500 ${
          isLoaded ? 'opacity-60' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
      />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
    </div>
  )
}