import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Image from 'next/image';
import { I18nProvider } from './i18n/client';
import { headers } from 'next/headers';

const sarasaGothic = localFont({
  src: [
    {
      path: './fonts/SarasaGothicJ-Light.ttf',
      weight: '300',
    },
    {
      path: './fonts/SarasaGothicJ-Regular.ttf',
      weight: '400',
    },
    {
      path: './fonts/SarasaGothicJ-Bold.ttf',
      weight: '700',
    },
  ],
  variable: '--font-sarasa-gothic',
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const lng = headersList.get('accept-language')?.split(',')[0] || 'en';

  const backgroundImage = getRandomBackground();
  
  return (
    <html lang={lng}>
      <body className={`${sarasaGothic.variable} antialiased font-[family-name:var(--font-sarasa-gothic)] bg-transparent w-[100vw] h-[100vh] relative`}>
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
