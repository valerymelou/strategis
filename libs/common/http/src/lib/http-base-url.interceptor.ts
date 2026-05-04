import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_ROOT_TOKEN, API_VERSION_TOKEN } from './http-tokens';

export const httpBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const apiRoot = inject(API_ROOT_TOKEN);
  const apiVersion = inject(API_VERSION_TOKEN);

  if (request.url.startsWith('http') || request.url.startsWith('/assets')) {
    return next(request);
  }

  request = request.clone({
    url: `${apiRoot}/${apiVersion}${request.url}`,
    withCredentials: true,
  });

  return next(request);
};
