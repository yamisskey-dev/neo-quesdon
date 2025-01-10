import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { fallbackLng, languages } from './app/i18n/settings';

function getLocale(request: NextRequest) {
  // Try get language from cookie first
  const langFromCookie = request.cookies.get('i18next')?.value;
  if (langFromCookie && languages.includes(langFromCookie)) {
    return langFromCookie;
  }

  // Otherwise detect from headers
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const userLanguages = new Negotiator({ headers: negotiatorHeaders }).languages();
  return match(userLanguages, languages, fallbackLng);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip static files and API routes
  if (
    pathname.includes('.') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next();
  }

  // Set detected language in cookie
  const locale = getLocale(request);
  const response = NextResponse.next();
  response.cookies.set('i18next', locale);

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};