import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import localFont from 'next/font/local'
import { I18nProvider } from './i18n/client'
import BackgroundWrapper from './_components/wallpaper'
import './globals.css'

const sarasaGothic = localFont({
  src: [
    { path: './fonts/SarasaGothicJ-Regular.ttf', weight: '400' }
  ],
  preload: true,
  display: 'swap',
  variable: '--font-sarasa-gothic'
})

// Add language detection
function detectLanguage(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'ja'
  const lang = acceptLanguage.split(',')[0].split('-')[0]
  return ['ja', 'en', 'ko'].includes(lang) ? lang : 'ja'
}

export const metadata: Metadata = {
  title: 'Neo-Quesdon',
  description: 'home.subtitle'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const lng = detectLanguage(headersList.get('accept-language'))
  
  return (
    <html lang={lng}>
      <body className={`${sarasaGothic.variable} relative min-h-screen`}>
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <BackgroundWrapper />
        </Suspense>
        <div className="relative z-10 min-h-screen">
          <I18nProvider lng={lng}>
            {children}
          </I18nProvider>
        </div>
      </body>
    </html>
  )
}