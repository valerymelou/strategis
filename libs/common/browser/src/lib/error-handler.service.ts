import { inject, Injectable } from '@angular/core';
import { SentryErrorHandler } from '@sentry/angular';
import * as Sentry from '@sentry/angular';

import { WINDOW_TOKEN } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService extends SentryErrorHandler {
  private readonly window = inject<Window>(WINDOW_TOKEN);

  constructor() {
    super({ logErrors: true, showDialog: false });
  }

  override handleError(error: unknown): void {
    // Webpack: "Loading chunk X failed"
    // esbuild/native dynamic import (Chrome): "Failed to fetch dynamically imported module"
    // esbuild/native dynamic import (Firefox): "error loading dynamically imported module"
    // esbuild/native dynamic import (Safari): "Importing a module script failed"
    const chunkFailedMessage =
      /Loading chunk [\d]+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;
    const message = (error as Error).message;

    if (chunkFailedMessage.test(message)) {
      Sentry.captureMessage('Chunk failed to load. Reloading...');
      Sentry.captureException(error as Error);
      this.window.location.reload();
    } else {
      super.handleError(error);
    }
  }
}
