import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_CONTENT_TYPE_TOKEN, API_VERSION_TOKEN } from './http-tokens';

export const httpBaseHeadersInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const apiContentType = inject(API_CONTENT_TYPE_TOKEN);
  const apiVersion = inject(API_VERSION_TOKEN);

  if (!request.url.startsWith('http')) {
    let headers = request.headers.set('Content-Type', `${apiContentType}`);
    headers = headers.set('Accept', `${apiContentType}; version=${apiVersion}`);

    const apiRequest = request.clone({ headers });

    return next(apiRequest);
  }

  return next(request);
};
