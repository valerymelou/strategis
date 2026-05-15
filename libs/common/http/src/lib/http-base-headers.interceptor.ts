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
    const isMultipart = request.body instanceof FormData;

    let headers = request.headers.set('Accept', `${apiContentType}; version=${apiVersion}`);
    if (!isMultipart) {
      headers = headers.set('Content-Type', `${apiContentType}`);
    }

    const apiRequest = request.clone({ headers });

    return next(apiRequest);
  }

  return next(request);
};
