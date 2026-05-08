import { UpperCasePipe } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideMenu, lucideMoon, lucideSun } from '@ng-icons/lucide';

import { LocalizeService } from '@strategis/common/localize';
import { ThemeService } from '@strategis/shared/theming';
import { Button } from '@strategis/shared/ui';

@Component({
  selector: 'app-navbar',
  imports: [NgIconComponent, Button, UpperCasePipe],
  providers: [provideIcons({ lucideSun, lucideMoon, lucideMenu })],
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly themeService = inject(ThemeService);
  private readonly localizeService = inject(LocalizeService);

  readonly hamburgerClick = output<void>();

  readonly currentLanguage = computed(() =>
    this.localizeService.getCurrentLanguage(),
  );

  readonly themeIcon = computed(() =>
    this.themeService.theme() === 'dark' ? 'lucideMoon' : 'lucideSun',
  );

  toggleTheme(): void {
    this.themeService.changeTheme(
      this.themeService.theme() === 'dark' ? 'light' : 'dark',
    );
  }

  toggleLanguage(): void {
    this.localizeService.changeLanguage(
      this.currentLanguage() === 'en' ? 'fr' : 'en',
    );
  }
}
