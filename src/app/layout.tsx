import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Image from 'next/image';
import { I18nProvider } from './i18n/client';
import { headers } from 'next/headers';

const theJamsil = localFont({
  src: [
    {
      path: './fonts/The-Jamsil-1-Thin.ttf', 
      weight: '100',
    },
    {
      path: './fonts/The-Jamsil-3-Regular.ttf',
      weight: '400',
    },
    {
      path: './fonts/The-Jamsil-6-ExtraBold.ttf',
      weight: '800',
    },
  ],
  variable: '--font-the-jamsil',
});

const BACKGROUND_IMAGES = [
  '/static/1.gif',
  '/static/2.gif',
  '/static/3.gif',
  '/static/4.gif',
] as const;

const getRandomBackground = () => {
  return BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
};

export const metadata: Metadata = {
  title: 'Neo-Quesdon',
  description: 'home.subtitle', // Will be translated
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const lng = headersList.get('accept-language')?.split(',')[0] || 'en';
  const backgroundImage = getRandomBackground();
  
  return (
    <html lang={lng}>
      <body className={`${theJamsil.variable} antialiased font-[family-name:var(--font-the-jamsil)] bg-transparent w-[100vw] h-[100vh] relative`}>
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          className="object-cover fixed inset-0 -z-10"
          priority
          unoptimized
        />
        <I18nProvider lng={lng}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}