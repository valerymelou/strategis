import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCog,
  lucideHouse,
  lucideLayers,
  lucideLogOut,
  lucidePlus,
  lucideStar,
  lucideUser,
  lucideUsersRound,
} from '@ng-icons/lucide';

import { AuthService } from '@strategis/auth/data-access';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIconComponent],
  providers: [
    provideIcons({
      lucideHouse,
      lucideLayers,
      lucidePlus,
      lucideStar,
      lucideUser,
      lucideUsersRound,
      lucideCog,
      lucideLogOut,
    }),
  ],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly authService = inject(AuthService);

  readonly open = input<boolean>(false);
  readonly closeRequest = output<void>();

  readonly menuOpen = signal(false);
  readonly currentUser = this.authService.currentUser;

  readonly initials = computed(() => {
    const first = this.currentUser()?.firstName ?? '';
    const last = this.currentUser()?.lastName ?? '';
    return [first, last]
      .filter(Boolean)
      .map((w) => w[0].toUpperCase())
      .join('');
  });

  readonly asideClass = computed(
    () =>
      `bg-sidebar fixed inset-y-0 left-0 z-30 flex h-screen w-64 shrink-0 flex-col overflow-hidden transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${this.open() ? 'translate-x-0' : '-translate-x-full'}`,
  );

  readonly sections: NavSection[] = [
    {
      title: $localize`:@@sidebar.section.workspace:WORKSPACE`,
      items: [
        {
          label: $localize`:@@sidebar.item.overview:Overview`,
          route: '/',
          icon: 'lucideHouse',
          exact: true,
        },
        {
          label: $localize`:@@sidebar.item.lots:My lots`,
          route: '/lots',
          icon: 'lucideLayers',
        },
        {
          label: $localize`:@@sidebar.item.declareLot:Declare a lot`,
          route: '/lots/new',
          icon: 'lucidePlus',
        },
      ],
    },
    {
      title: $localize`:@@sidebar.section.account:ACCOUNT`,
      items: [
        {
          label: $localize`:@@sidebar.item.profile:Professional profile`,
          route: '/profile',
          icon: 'lucideUser',
        },
        {
          label: $localize`:@@sidebar.item.roles:Actor roles`,
          route: '/roles',
          icon: 'lucideUsersRound',
        },
        {
          label: $localize`:@@sidebar.item.subscription:Subscription`,
          route: '/subscription',
          icon: 'lucideStar',
        },
      ],
    },
  ];

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await firstValueFrom(this.authService.logout());
    this.closeRequest.emit();
  }
}
