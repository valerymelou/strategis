import { Injectable, DOCUMENT, inject, signal } from '@angular/core';

import { CookiesService, WINDOW_TOKEN } from '@strategis/common/browser';

const THEME_STORAGE_KEY = 'theme';
const DARK_MODE_CLASS = 'dark';

export type Theme = 'dark' | 'light' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly theme = signal<Theme>('light');

  private document = inject(DOCUMENT);
  private window = inject(WINDOW_TOKEN);
  private cookiesService = inject(CookiesService);

  private systemMediaQuery = this.window.matchMedia(
    '(prefers-color-scheme: dark)',
  );
  private systemListener = (e: MediaQueryListEvent) => {
    if (this.theme() === 'system') {
      this.applyTheme(e.matches ? 'dark' : 'light');
    }
  };

  constructor() {
    this.initializeTheme();
  }

  /**
   * Changes the current theme and stores it in cookies
   */
  changeTheme(theme: Theme): void {
    this.cookiesService.setCookie(THEME_STORAGE_KEY, theme);
    this.theme.set(theme);

    if (theme === 'system') {
      this.applyTheme(this.resolveSystemTheme());
      this.systemMediaQuery.addEventListener('change', this.systemListener);
    } else {
      this.systemMediaQuery.removeEventListener('change', this.systemListener);
      this.applyTheme(theme);
    }
  }

  /**
   * Initializes the theme by checking cookies first, then system preference
   */
  private initializeTheme(): void {
    const storedTheme = this.cookiesService.getCookie(
      THEME_STORAGE_KEY,
    ) as Theme;

    const themeToUse: Theme =
      storedTheme === 'dark' ||
      storedTheme === 'light' ||
      storedTheme === 'system'
        ? storedTheme
        : 'system';

    if (!storedTheme) {
      this.cookiesService.setCookie(THEME_STORAGE_KEY, themeToUse);
    }

    this.theme.set(themeToUse);

    if (themeToUse === 'system') {
      this.applyTheme(this.resolveSystemTheme());
      this.systemMediaQuery.addEventListener('change', this.systemListener);
    } else {
      this.applyTheme(themeToUse);
    }
  }

  private resolveSystemTheme(): 'dark' | 'light' {
    return this.systemMediaQuery.matches ? 'dark' : 'light';
  }

  /**
   * Applies the theme by adding/removing CSS classes
   */
  private applyTheme(theme: 'dark' | 'light'): void {
    if (theme === 'dark') {
      this.document.documentElement.classList.add(DARK_MODE_CLASS);
    } else {
      this.document.documentElement.classList.remove(DARK_MODE_CLASS);
    }
  }
}
