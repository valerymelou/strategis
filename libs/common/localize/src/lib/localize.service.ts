import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalizeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  isSameLanguage(lang: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this.document.cookie.includes(`strategis-language-override=${lang}`);
  }

  getCurrentLanguage(): string {
    if (!isPlatformBrowser(this.platformId)) return 'en';
    if (this.isSameLanguage('fr')) return 'fr';
    if (this.isSameLanguage('en')) return 'en';
    // Fall back to the document's lang attribute set by Angular i18n
    return this.document.documentElement.lang || 'en';
  }

  async changeLanguage(lang: string) {
    this.document.cookie = `strategis-language-override=${lang}; path=/; max-age=31536000`;
    await this.reload();
  }

  private async reload() {
    if (!isPlatformBrowser(this.platformId)) return;

    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      } catch (err) {
        console.error('Failed to unregister service worker', err);
      }
    }

    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cache) => caches.delete(cache)));
      } catch (err) {
        console.error('Failed to clear cache', err);
      }
    }

    this.document.location.reload();
  }
}
