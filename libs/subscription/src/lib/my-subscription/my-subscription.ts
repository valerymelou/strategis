import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw, lucideArrowUpCircle } from '@ng-icons/lucide';

import {
  PremiumUpgradeRequest,
  PremiumUpgradeRequestService,
} from '@strategis/profiles/data-access';
import { AuthService } from '@strategis/auth/data-access';
import { ToastService, Badge, Button } from '@strategis/shared/ui';

@Component({
  selector: 'lib-my-subscription',
  imports: [DatePipe, NgIconComponent, Badge, Button],
  providers: [provideIcons({ lucideRefreshCw, lucideArrowUpCircle })],
  templateUrl: './my-subscription.html',
})
export class MySubscription implements OnInit {
  private readonly premiumService = inject(PremiumUpgradeRequestService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly requests = signal<PremiumUpgradeRequest[]>([]);
  readonly isLoading = signal(true);
  readonly isRequesting = signal(false);

  readonly tier = computed(
    () => this.authService.currentUser()?.profile?.tier ?? 'free',
  );
  readonly latestRequest = computed(() => this.requests()[0] ?? null);
  readonly hasPendingRequest = computed(() =>
    this.requests().some((r) => r.status === 'pending'),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.premiumService.listAll().subscribe({
      next: (result) => {
        const sorted = [...(result.data ?? [])].sort((a, b) =>
          (b.created ?? '').localeCompare(a.created ?? ''),
        );
        this.requests.set(sorted);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error(
          $localize`:@@subscription.error.loadFailed:Failed to load subscription data.`,
        );
        this.isLoading.set(false);
      },
    });
  }

  requestUpgrade(): void {
    if (this.isRequesting() || this.hasPendingRequest()) return;

    const profile = this.authService.currentUser()?.profile;
    if (!profile) return;

    this.isRequesting.set(true);
    this.premiumService.requestUpgrade(profile.id ?? '').subscribe({
      next: () => {
        this.toast.success(
          $localize`:@@subscription.success.upgradeRequested:Your premium upgrade request has been submitted.`,
        );
        this.isRequesting.set(false);
        this.load();
      },
      error: () => {
        this.toast.error(
          $localize`:@@subscription.error.upgradeFailed:Failed to submit upgrade request. Please try again.`,
        );
        this.isRequesting.set(false);
      },
    });
  }
}
