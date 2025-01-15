import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { headers } from 'next/headers'
import { I18nProvider } from './i18n/client'
import BackgroundWrapper from './_components/wallpaper'

const sarasaGothic = localFont({
  src: [
    { path: './fonts/SarasaGothicJ-Regular.ttf', weight: '400' }
  ],
  preload: true,
  display: 'swap',
  variable: '--font-sarasa-gothic'
})

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
  const lng = headersList.get('accept-language')?.split(',')[0] || 'en'
  
  return (
    <html lang={lng}>
      <body className={`${sarasaGothic.variable} relative min-h-screen`}>
        <BackgroundWrapper />
        <div className="relative z-10 min-h-screen">
          <I18nProvider lng={lng}>
            {children}
          </I18nProvider>
        </div>
      </body>
    </html>
  )
}