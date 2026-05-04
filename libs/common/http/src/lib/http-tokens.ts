import { InjectionToken } from '@angular/core';

export const API_ROOT_TOKEN = new InjectionToken<string>('Root of the API');
export const API_VERSION_TOKEN = new InjectionToken<string>(
  'Version of the API',
);
export const API_CONTENT_TYPE_TOKEN = new InjectionToken<string>(
  'Content type of the API',
);
