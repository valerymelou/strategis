import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArchive,
  lucideBuilding2,
  lucideChevronRight,
  lucideFileText,
  lucideFolderOpen,
  lucideFolderTree,
  lucideLayoutDashboard,
  lucideLogOut,
  lucideSettings,
  lucideTrash2,
} from '@ng-icons/lucide';

import { AuthService } from '@strategis/auth/data-access';
import { Button } from '@strategis/shared/ui';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIconComponent, Button],
  providers: [
    provideIcons({
      lucideArchive,
      lucideBuilding2,
      lucideChevronRight,
      lucideFileText,
      lucideFolderOpen,
      lucideFolderTree,
      lucideLayoutDashboard,
      lucideLogOut,
      lucideSettings,
      lucideTrash2,
    }),
  ],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  /** Controlled from Layout on mobile; desktop always shows via CSS. */
  readonly open = input(false);

  readonly menuOpen = signal(false);

  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;

  /** Two-letter initials derived from name or email. */
  readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user) return '??';
    if (user.name) {
      return user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
    }
    return user.email.slice(0, 2).toUpperCase();
  });

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout().subscribe();
  }

  readonly sections: NavSection[] = [
    {
      title: $localize`:@@sidebar.section.workspace:Workspace`,
      items: [
        {
          label: $localize`:@@sidebar.item.dashboard:Dashboard`,
          route: '/',
          icon: 'lucideLayoutDashboard',
          exact: true,
        },
        {
          label: $localize`:@@sidebar.item.documents:Upload Documents`,
          route: '/documents',
          icon: 'lucideFileText',
        },
        {
          label: $localize`:@@sidebar.item.directory:Directory`,
          route: '/collections',
          icon: 'lucideFolderOpen',
        },
        {
          label: $localize`:@@sidebar.item.eliminations:Eliminations`,
          route: '/eliminations',
          icon: 'lucideTrash2',
        },
      ],
    },
    {
      title: $localize`:@@sidebar.section.administration:Administration`,
      items: [
        {
          label: $localize`:@@sidebar.item.classificationPlan:Classification Plan`,
          route: '/admin/classification-plan',
          icon: 'lucideFolderTree',
        },
      ],
    },
  ];
}
