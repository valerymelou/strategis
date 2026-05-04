import { Component, computed, inject, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideMenu,
  lucideMoon,
  lucideSearch,
  lucideSun,
  lucideUpload,
  lucideWandSparkles,
} from '@ng-icons/lucide';
import { ThemeService } from '@strategis/shared/theming';
import { Button } from '@strategis/shared/ui';

@Component({
  selector: 'app-navbar',
  imports: [NgIconComponent, Button],
  providers: [
    provideIcons({
      lucideBell,
      lucideMenu,
      lucideMoon,
      lucideSearch,
      lucideSun,
      lucideUpload,
      lucideWandSparkles,
    }),
  ],
  templateUrl: './navbar.html',
})
export class Navbar {
  readonly toggleSidebar = output<void>();

  private readonly themeService = inject(ThemeService);

  readonly currentTheme = this.themeService.theme;

  readonly themeIcon = computed(() =>
    this.currentTheme() === 'dark' ? 'lucideSun' : 'lucideMoon',
  );

  toggleTheme(): void {
    this.themeService.changeTheme(
      this.currentTheme() === 'dark' ? 'light' : 'dark',
    );
  }
}
