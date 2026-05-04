import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { appRoutes } from './app.routes';

import {
  API_CONTENT_TYPE_TOKEN,
  API_ROOT_TOKEN,
  API_VERSION_TOKEN,
  httpBaseHeadersInterceptor,
  httpBaseUrlInterceptor,
  httpLocaleInterceptor,
} from '@strategis/common/http';
import { WINDOW_TOKEN } from '@strategis/common/browser';
import { AuthService, httpAuthInterceptor } from '@strategis/auth/data-access';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(
      withInterceptors([
        httpAuthInterceptor,
        httpBaseHeadersInterceptor,
        httpBaseUrlInterceptor,
        httpLocaleInterceptor,
      ]),
    ),
    provideAppInitializer(() => inject(AuthService).initializeAuth()),
    {
      provide: API_CONTENT_TYPE_TOKEN,
      useValue: process.env['ENV_API_CONTENT_TYPE'],
    },
    { provide: API_ROOT_TOKEN, useValue: process.env['ENV_API_ROOT'] },
    {
      provide: API_VERSION_TOKEN,
      useValue: process.env['ENV_API_VERSION'],
    },
    {
      provide: WINDOW_TOKEN,
      useFactory: () => {
        if (typeof window !== 'undefined') {
          return window;
        }

        return {
          matchMedia: () => ({
            removeEventListener: () => true,
            addEventListener: () => true,
            matches: true,
          }),
          location: {
            origin:
              process.env['ENV_ENVIRONMENT'] === 'production'
                ? 'https://flow.strategis.com'
                : 'https://staging.strategis.com',
            href: '',
          },
        };
      },
    },
  ],
};
