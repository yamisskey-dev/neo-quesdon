import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Negotiator from 'negotiator';
import { fallbackLng } from './app/i18n/settings';

const COOKIE_NAME = 'i18next';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
const STATIC_FILE_PATTERN = /\.(?:ico|jpg|jpeg|png|gif|svg|js|css|woff|woff2)$/i;
const SKIP_PATTERNS = ['/api/', '/_next/'];

// Define valid locales
const LOCALES = {
  'ja': 'ja-JP',
  'en': 'en-US',
  'ko': 'ko-KR'
} as const;

type ValidLocale = (typeof LOCALES)[keyof typeof LOCALES];
const VALID_LOCALES = new Set(Object.values(LOCALES));

function normalizeLocale(locale: string): ValidLocale {
  if (!locale) return fallbackLng as ValidLocale;
  
  try {
    // Handle simple language codes
    const simpleLang = locale.toLowerCase().split('-')[0];
    if (simpleLang in LOCALES) {
      return LOCALES[simpleLang as keyof typeof LOCALES];
    }

    // Handle full locales
    const normalized = locale
      .toLowerCase()
      .replace(/_/g, '-')
      .split('-')
      .map((part, index) => index === 1 ? part.toUpperCase() : part)
      .join('-');

    return VALID_LOCALES.has(normalized as ValidLocale) 
      ? normalized as ValidLocale 
      : fallbackLng as ValidLocale;
  } catch (error) {
    console.error('Locale normalization error:', error);
    return fallbackLng as ValidLocale;
  }
}

let previousLocale: string | null = null;

function getLocale(request: NextRequest): string {
  try {
    // Check cookie first
    const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
    if (cookieLocale) {
      const normalized = normalizeLocale(cookieLocale);
      if (normalized !== previousLocale) {
        console.info(`[i18n] Locale changed to: ${normalized}`);
        previousLocale = normalized;
      }
      return normalized;
    }

    // Parse accept-language headers
    const languages = request.headers.get('accept-language');
    if (!languages) {
      if (fallbackLng !== previousLocale) {
        console.info(`[i18n] No language header, using fallback: ${fallbackLng}`);
        previousLocale = fallbackLng;
      }
      return fallbackLng;
    }

    // Detect user languages
    const userLanguages = new Negotiator({
      headers: { 'accept-language': languages }
    }).languages()
      .map(lang => normalizeLocale(lang))
      .filter(lang => VALID_LOCALES.has(lang));

    const detectedLocale = userLanguages[0] || fallbackLng;
    if (detectedLocale !== previousLocale) {
      console.info(`[i18n] Detected locale: ${detectedLocale}`);
      previousLocale = detectedLocale;
    }
    return detectedLocale;

  } catch (error) {
    console.error('[i18n] Locale detection error:', error);
    return fallbackLng;
  }
}

function shouldSkipPath(pathname: string): boolean {
  return STATIC_FILE_PATTERN.test(pathname) || 
         SKIP_PATTERNS.some(pattern => pathname.startsWith(pattern));
}

export function middleware(request: NextRequest) {
  try {
    if (shouldSkipPath(request.nextUrl.pathname)) {
      return NextResponse.next();
    }

    const locale = getLocale(request);
    const response = NextResponse.next();

    response.cookies.set(COOKIE_NAME, locale, {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true
    });

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};