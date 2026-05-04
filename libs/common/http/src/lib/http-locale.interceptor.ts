import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, LOCALE_ID, PLATFORM_ID, REQUEST } from '@angular/core';

const LANGUAGE_COOKIE = 'strategis-language-override';

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export const httpLocaleInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  let locale: string;
  if (isPlatformBrowser(platformId)) {
    locale = inject(LOCALE_ID);
  } else {
    const request = inject(REQUEST, { optional: true });
    const cookieHeader = request?.headers.get('cookie') ?? '';
    locale = parseCookie(cookieHeader, LANGUAGE_COOKIE) ?? inject(LOCALE_ID);
  }

  req = req.clone({
    setHeaders: {
      'Accept-Language': locale,
    },
  });

  return next(req);
};
